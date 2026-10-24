<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowDown,
		ArrowLeft,
		ArrowRight,
		ArrowUp,
		Check,
		FlipHorizontal2,
		RotateCw,
		Sparkles
	} from '@lucide/svelte';
	import GameIntro from '#lib/components/games/GameIntro.svelte';
	import GameResults from '#lib/components/games/GameResults.svelte';
	import GameTopBar from '#lib/components/games/GameTopBar.svelte';
	import PauseOverlay from '#lib/components/games/PauseOverlay.svelte';
	import StartCountdown from '#lib/components/games/StartCountdown.svelte';
	import GameQuitDialog from '#lib/components/games/GameQuitDialog.svelte';
	import {
		LEVEL_SIZES,
		LEVEL_TIME_MS,
		EAST,
		NORTH,
		SOUTH,
		WEST,
		flipMask,
		generateLevel,
		isSolved,
		matrixScore,
		rotateMask,
		scrambleLevel,
		traceFlow,
		type MatrixLevel
	} from '#lib/games/matrix-flow/engine';
	import { mulberry32, randomSeed } from '#lib/games/shared/rng';
	import type { GameMeta } from '#lib/data/games';
	import type { GamePhase, GameResult } from '#lib/games/shared/types';
	import { startPageScroll, stopPageScroll } from '#lib/motion/lenis';
	import { formatClock } from '#lib/utils/format';
	import { progress, type RecordResult } from '#lib/stores/progress.svelte';

	type Props = { meta: GameMeta };
	let { meta }: Props = $props();

	const WRONG_CHECK_PENALTY = 5_000;
	const SIDES = [
		{ bit: NORTH, x1: 50, y1: 50, x2: 50, y2: 6 },
		{ bit: EAST, x1: 50, y1: 50, x2: 94, y2: 50 },
		{ bit: SOUTH, x1: 50, y1: 50, x2: 50, y2: 94 },
		{ bit: WEST, x1: 50, y1: 50, x2: 6, y2: 50 }
	];

	let phase = $state<GamePhase>('intro');
	let levels = $state<MatrixLevel[]>([]);
	let levelIndex = $state(0);
	let tiles = $state<number[]>([]);
	let selected = $state(0);
	let remaining = $state(LEVEL_TIME_MS);
	let activeMs = $state(0);
	let levelsCleared = $state(0);
	let checks = $state(0);
	let wrongChecks = $state(0);
	let timeBank = $state(0);
	let flash = $state('');
	let result = $state<GameResult | null>(null);
	let record = $state<RecordResult | null>(null);
	let confirmingQuit = $state(false);
	let rng = mulberry32(randomSeed());
	let deadline = 0;
	let raf = 0;
	let lastFrame = 0;
	let flashTimer: ReturnType<typeof setTimeout> | null = null;
	let transitionTimer: ReturnType<typeof setTimeout> | null = null;

	const level = $derived(levels[levelIndex]);
	const size = $derived(level?.size ?? 3);
	const completedLabel = $derived(
		levelsCleared === LEVEL_SIZES.length ? 'Complete' : `${levelsCleared} / ${LEVEL_SIZES.length}`
	);
	const urgent = $derived(remaining <= 15_000);
	const timerProgress = $derived((remaining / LEVEL_TIME_MS) * 100);
	const flow = $derived(traceFlow(tiles, size));
	const flowPath = $derived(new Set(flow.path));
	const flowLabel = $derived(
		flow.connected
			? 'Route connected'
			: flow.depths.size <= 1
				? 'Signal blocked at IN'
				: `${flow.depths.size} tiles linked · OUT unreached`
	);

	onMount(() => {
		progress.load();
		return () => {
			cancelAnimationFrame(raf);
			if (flashTimer) clearTimeout(flashTimer);
			if (transitionTimer) clearTimeout(transitionTimer);
			startPageScroll();
		};
	});

	function prepareRun(): void {
		cancelAnimationFrame(raf);
		rng = mulberry32(randomSeed());
		levels = LEVEL_SIZES.map((levelSize) => generateLevel(levelSize, rng));
		levelIndex = 0;
		remaining = LEVEL_TIME_MS;
		activeMs = 0;
		levelsCleared = 0;
		checks = 0;
		wrongChecks = 0;
		timeBank = 0;
		result = null;
		record = null;
		flash = '';
		setupLevel(0);
	}

	function setupLevel(index: number): void {
		const current = levels[index];
		if (!current) return;
		tiles = scrambleLevel(current, rng);
		selected = 0;
	}

	function startDrill(): void {
		prepareRun();
		phase = 'countdown';
		stopPageScroll();
	}

	function startRun(): void {
		if (!levels.length) prepareRun();
		phase = 'playing';
		lastFrame = performance.now();
		deadline = lastFrame + remaining;
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(loop);
	}

	function loop(now: number): void {
		if (phase !== 'playing') return;
		const delta = Math.max(0, now - lastFrame);
		lastFrame = now;
		activeMs += delta;
		remaining = Math.max(0, deadline - now);
		if (remaining <= 0) {
			finish();
			return;
		}
		raf = requestAnimationFrame(loop);
	}

	function pause(): void {
		if (phase !== 'playing') return;
		remaining = Math.max(0, deadline - performance.now());
		cancelAnimationFrame(raf);
		phase = 'paused';
	}

	function resume(): void {
		if (phase !== 'paused') return;
		phase = 'playing';
		lastFrame = performance.now();
		deadline = lastFrame + remaining;
		raf = requestAnimationFrame(loop);
	}

	function showFlash(message: string, ms = 1800): void {
		flash = message;
		if (flashTimer) clearTimeout(flashTimer);
		flashTimer = setTimeout(() => {
			flash = '';
		}, ms);
	}

	function rotateTile(index: number): void {
		if (phase !== 'playing') return;
		selected = index;
		tiles = tiles.map((mask, tileIndex) => (tileIndex === index ? rotateMask(mask, 1) : mask));
	}

	function flipTile(): void {
		if (phase !== 'playing') return;
		tiles = tiles.map((mask, tileIndex) => (tileIndex === selected ? flipMask(mask) : mask));
	}

	function checkRoute(): void {
		if (phase !== 'playing') return;
		checks += 1;
		if (!isSolved(tiles, size)) {
			wrongChecks += 1;
			remaining = Math.max(0, remaining - WRONG_CHECK_PENALTY);
			deadline -= WRONG_CHECK_PENALTY;
			showFlash('Path incomplete · −5 seconds');
			if (remaining <= 0) finish();
			return;
		}

		timeBank += remaining;
		levelsCleared = levelIndex + 1;
		if (levelIndex >= levels.length - 1) {
			finish();
			return;
		}

		showFlash('Grid clear. Next layout incoming.');
		transitionTimer = setTimeout(() => {
			levelIndex += 1;
			remaining = LEVEL_TIME_MS;
			setupLevel(levelIndex);
			deadline = performance.now() + remaining;
			lastFrame = performance.now();
		}, 900);
	}

	function finish(): void {
		if (phase === 'results') return;
		cancelAnimationFrame(raf);
		if (transitionTimer) clearTimeout(transitionTimer);
		phase = 'results';
		startPageScroll();
		const score = matrixScore(levelsCleared, timeBank, wrongChecks);
		const attempts = levelsCleared + wrongChecks;
		const accuracy = attempts === 0 ? 0 : Math.round((levelsCleared / attempts) * 100);
		result = {
			score,
			accuracy,
			durationMs: Math.round(activeMs),
			metrics: {
				levels: levelsCleared,
				checks,
				wrongChecks,
				timeRemaining: Math.round(timeBank / 1000)
			}
		};
		record = progress.record(meta.slug, result);
	}

	function requestQuit(): void {
		if (phase === 'playing') pause();
		confirmingQuit = true;
	}

	function confirmQuit(): void {
		cancelAnimationFrame(raf);
		if (transitionTimer) clearTimeout(transitionTimer);
		confirmingQuit = false;
		phase = 'intro';
		result = null;
		record = null;
		startPageScroll();
	}

	function retry(): void {
		prepareRun();
		phase = 'countdown';
		stopPageScroll();
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			return;
		if (confirmingQuit) {
			if (event.key === 'Escape') confirmingQuit = false;
			return;
		}
		if (phase === 'paused') {
			if (event.key === 'Escape') resume();
			return;
		}
		if (phase !== 'playing') return;

		const key = event.key.toLowerCase();
		if (key === 'escape') {
			event.preventDefault();
			pause();
			return;
		}
		if (key === 'r') {
			event.preventDefault();
			rotateTile(selected);
			return;
		}
		if (key === 'f') {
			event.preventDefault();
			flipTile();
			return;
		}
		if (key === 'enter') {
			event.preventDefault();
			checkRoute();
			return;
		}

		const x = selected % size;
		const y = Math.floor(selected / size);
		let next: number;
		if (event.key === 'ArrowUp') next = y > 0 ? selected - size : selected;
		else if (event.key === 'ArrowDown') next = y < size - 1 ? selected + size : selected;
		else if (event.key === 'ArrowLeft') next = x > 0 ? selected - 1 : selected;
		else if (event.key === 'ArrowRight') next = x < size - 1 ? selected + 1 : selected;
		else return;
		event.preventDefault();
		selected = next;
	}

	const headline = $derived(
		!result
			? ''
			: result.score >= 90
				? 'Path found. Under pressure.'
				: levelsCleared === LEVEL_SIZES.length
					? 'Every grid cleared.'
					: result.score >= 55
						? 'Strong routing. One more layer.'
						: 'The clock won this one.'
	);
	const summary = $derived(
		!result
			? ''
			: `You cleared ${levelsCleared} of ${LEVEL_SIZES.length} grids, validated ${checks} ${checks === 1 ? 'route' : 'routes'}, and left ${formatClock(timeBank)} of banked time on the board.`
	);
	const resultStats = $derived(
		!result
			? []
			: [
					{ label: 'Grids cleared', value: `${levelsCleared} / ${LEVEL_SIZES.length}` },
					{ label: 'Time banked', value: formatClock(timeBank) },
					{ label: 'Route checks', value: String(checks) },
					{ label: 'Wrong checks', value: String(wrongChecks) }
				]
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if phase === 'intro'}
	<GameIntro
		{meta}
		best={progress.bestFor(meta.slug)}
		attempts={progress.statsFor(meta.slug).attempts}
		onStart={startDrill}
	/>
{:else if phase === 'results' && result && record}
	<GameResults
		{meta}
		{result}
		isBest={record.isBest}
		previousBest={record.previousBest}
		{headline}
		{summary}
		stats={resultStats}
		onRetry={retry}
	/>
{:else}
	<div class="play-shell" style={`--accent: ${meta.accent}; --accent-soft: ${meta.softAccent}`}>
		<GameTopBar
			{meta}
			levelLabel={`Level ${Math.min(levelIndex + 1, LEVEL_SIZES.length)} of ${LEVEL_SIZES.length} · ${size}×${size}`}
			timer={formatClock(remaining)}
			progress={timerProgress}
			{urgent}
			onPause={pause}
			onQuit={requestQuit}
			stats={topStats}
		/>

		<main class="lab-container-wide px-4 pt-[calc(74px+1.25rem)] pb-6 sm:pt-[calc(74px+1.5rem)]">
			<div class="play-grid">
				<section class="board-panel noise">
					<div class="relative z-10">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<div class="eyebrow">Grid {String(levelIndex + 1).padStart(2, '0')}</div>
								<h1
									class="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-none font-semibold tracking-[-0.05em] text-white"
								>
									Route IN to OUT.
								</h1>
								<div class="mt-3 flex flex-wrap items-center gap-2">
									<span
										class="flow-status"
										class:connected={flow.connected}
										class:blocked={flow.depths.size <= 1}
										aria-live="polite"
									>
										<span class="flow-status-dot"></span>
										{flowLabel}
									</span>
									<span class="text-[0.6rem] tracking-[0.12em] text-fog uppercase"
										>Signal flows left → right</span
									>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<div class="mini-stat">
									<span>Cleared</span>
									<strong>{completedLabel}</strong>
								</div>
								<div class="mini-stat">
									<span>Checks</span>
									<strong>{checks}</strong>
								</div>
							</div>
						</div>

						<div class="relative mt-6">
							<div class="matrix-layout">
								<div class="rail rail-in" aria-hidden="true">
									<span>IN</span>
									<span class="rail-arrow"><ArrowRight size={13} /></span>
								</div>

								<div class="matrix-frame">
									<div class="matrix-grid" style={`--n: ${size}`}>
										{#each tiles as mask, index (index)}
											<button
												type="button"
												class="matrix-tile"
												class:selected={selected === index}
												class:endpoint={index === 0 || index === tiles.length - 1}
												class:entry={index === 0}
												class:exit={index === tiles.length - 1}
												class:flow-live={flow.depths.has(index)}
												class:flow-complete={flow.connected && flowPath.has(index)}
												style={`--tile-accent: ${meta.accent}; --flow-delay: ${Math.min(flow.depths.get(index) ?? 0, 12) * 95}ms;`}
												aria-label={`Tile ${index + 1}, ${['north', 'east', 'south', 'west'].filter((_, side) => mask & (1 << side)).join(' and ') || 'no'} connections`}
												onclick={() => rotateTile(index)}
											>
												<svg viewBox="0 0 100 100" class="size-full" aria-hidden="true">
													{#each SIDES as side (side.bit)}
														{#if mask & side.bit}
															<line x1={side.x1} y1={side.y1} x2={side.x2} y2={side.y2} />
														{/if}
													{/each}
													<circle cx="50" cy="50" r="7" class="tile-core" />
												</svg>
											</button>
										{/each}
									</div>
								</div>

								<div class="rail rail-out" class:live={flow.connected} aria-hidden="true">
									<span class="rail-arrow"><ArrowRight size={13} /></span>
									<span>OUT</span>
								</div>
							</div>

							{#if flash}
								<div class="flash-toast">{flash}</div>
							{/if}
						</div>

						<div
							class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.065] pt-4"
						>
							<div class="text-[0.68rem] text-fog">
								Selected tile <span class="font-display font-semibold text-white"
									>{selected + 1}</span
								>
								· <span class="text-mist">rotate or flip it</span>
							</div>
							<div class="flex flex-wrap gap-2">
								<button type="button" class="tool-btn" onclick={() => rotateTile(selected)}>
									<RotateCw size={14} />
									Rotate
								</button>
								<button type="button" class="tool-btn" onclick={flipTile}>
									<FlipHorizontal2 size={14} />
									Flip
								</button>
								<button
									type="button"
									class="btn btn-primary !min-h-10 !px-4 !py-2 text-xs"
									class:route-ready={flow.connected}
									onclick={checkRoute}
								>
									<Check size={14} />
									Check route
								</button>
							</div>
						</div>
					</div>
				</section>

				<aside class="space-y-3">
					<div class="info-panel">
						<div class="flex items-center justify-between gap-3">
							<span class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
								>Session bank</span
							>
							<Sparkles size={14} class="text-violet-soft" />
						</div>
						<div class="mt-4 grid grid-cols-2 gap-3">
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Time banked</div>
								<div class="mt-1 font-display text-lg text-white">{formatClock(timeBank)}</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Wrong checks</div>
								<div class="mt-1 font-display text-lg text-white">{wrongChecks}</div>
							</div>
						</div>
						<div class="mt-5 flex gap-1.5">
							{#each LEVEL_SIZES as gridSize, index (index)}
								<div
									class={`h-1 flex-1 rounded-full ${index < levelsCleared ? 'bg-violet' : 'bg-white/10'}`}
									title={`Level ${index + 1}: ${gridSize}×${gridSize}`}
								></div>
							{/each}
						</div>
						<div class="mt-2 flex justify-between text-[0.58rem] text-fog">
							{#each LEVEL_SIZES as gridSize, index (index)}
								<span>{index < levelsCleared ? '✓' : '○'} {gridSize}×{gridSize}</span>
							{/each}
						</div>
					</div>

					<div class="info-panel">
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase">
							How to route
						</div>
						<div class="mt-4 space-y-3">
							<div class="flex gap-3">
								<span class="shortcut"><ArrowRight size={13} /></span>
								<p class="text-[0.68rem] leading-5 text-mist">
									The signal travels left to right. Link the IN rail to the OUT rail.
								</p>
							</div>
							<div class="flex gap-3">
								<span class="shortcut">R</span>
								<p class="text-[0.68rem] leading-5 text-mist">
									Rotate the selected tile a quarter turn.
								</p>
							</div>
							<div class="flex gap-3">
								<span class="shortcut">F</span>
								<p class="text-[0.68rem] leading-5 text-mist">
									Flip it horizontally when rotation is not enough.
								</p>
							</div>
							<div class="flex gap-3">
								<span class="shortcut">↵</span>
								<p class="text-[0.68rem] leading-5 text-mist">
									Validate the route. A failed check costs five seconds.
								</p>
							</div>
						</div>
					</div>

					<div class="info-panel">
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase">
							Move selection
						</div>
						<div class="mt-4 grid w-28 grid-cols-3 gap-1.5 text-fog">
							<span></span>
							<span class="keycap"><ArrowUp size={13} /></span>
							<span></span>
							<span class="keycap"><ArrowLeft size={13} /></span>
							<span class="keycap"><ArrowDown size={13} /></span>
							<span class="keycap"><ArrowRight size={13} /></span>
						</div>
						<p class="mt-4 text-[0.65rem] leading-5 text-fog">
							Click any tile to select and rotate it. The highlighted tile is the one Flip affects.
						</p>
					</div>
				</aside>
			</div>
		</main>

		{#if phase === 'countdown'}
			<StartCountdown onComplete={startRun} label="Route ready" />
		{/if}

		<PauseOverlay
			open={phase === 'paused' && !confirmingQuit}
			onResume={resume}
			onRestart={retry}
			onQuit={requestQuit}
		/>

		<GameQuitDialog
			open={confirmingQuit}
			onCancel={() => (confirmingQuit = false)}
			onConfirm={confirmQuit}
		/>
	</div>
{/if}

{#snippet topStats()}
	<div class="flex items-center gap-5">
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Level</div>
			<div class="mt-1 font-display text-sm text-white">
				{levelIndex + 1} / {LEVEL_SIZES.length}
			</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Cleared</div>
			<div class="mt-1 font-display text-sm text-white">{levelsCleared}</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Wrong</div>
			<div class="mt-1 font-display text-sm text-white">{wrongChecks}</div>
		</div>
	</div>
{/snippet}

<style>
	.play-shell {
		--flow-blue: #4cc9ff;
		--flow-blue-soft: rgba(76, 201, 255, 0.16);
		min-height: 100svh;
		background:
			radial-gradient(ellipse 55% 40% at 50% 0%, var(--accent-soft), transparent 68%),
			var(--color-void);
	}

	.play-grid {
		display: grid;
		gap: 1rem;
	}

	.board-panel {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.6rem;
		padding: clamp(1rem, 2.5vw, 1.6rem);
		background:
			linear-gradient(150deg, rgba(255, 255, 255, 0.035), transparent 42%), rgba(14, 11, 20, 0.8);
		box-shadow: 0 30px 100px rgba(0, 0, 0, 0.28);
	}

	.mini-stat {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.7rem;
		padding: 0.5rem 0.62rem;
		background: rgba(255, 255, 255, 0.025);
	}

	.mini-stat span {
		display: block;
		color: var(--color-fog);
		font-size: 0.5rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.mini-stat strong {
		display: block;
		margin-top: 0.25rem;
		color: white;
		font-family: var(--font-display);
		font-size: 0.76rem;
		font-weight: 600;
	}

	.matrix-layout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
	}

	.matrix-frame {
		width: min(100%, 28rem);
		padding: clamp(0.65rem, 2vw, 1rem);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.4rem;
		background:
			linear-gradient(145deg, rgba(161, 0, 255, 0.065), transparent 52%), rgba(5, 4, 9, 0.62);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
	}

	.matrix-grid {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: clamp(0.3rem, 1.1vw, 0.55rem);
		aspect-ratio: 1;
	}

	.matrix-tile {
		position: relative;
		min-width: 0;
		border: 1px solid rgba(255, 255, 255, 0.075);
		border-radius: clamp(0.55rem, 1.6vw, 0.9rem);
		background:
			radial-gradient(circle at center, rgba(161, 0, 255, 0.08), transparent 65%),
			rgba(255, 255, 255, 0.025);
		color: color-mix(in srgb, var(--tile-accent) 75%, white);
		transition:
			transform 180ms var(--ease-out-expo),
			border-color 180ms ease,
			background-color 180ms ease,
			box-shadow 180ms ease;
	}

	.matrix-tile:hover {
		border-color: color-mix(in srgb, var(--tile-accent) 45%, transparent);
		background-color: rgba(255, 255, 255, 0.045);
		transform: translateY(-2px);
	}

	.matrix-tile.selected {
		border-color: color-mix(in srgb, var(--tile-accent) 70%, transparent);
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--tile-accent) 35%, transparent),
			0 0 28px color-mix(in srgb, var(--tile-accent) 15%, transparent);
	}

	.matrix-tile.endpoint::after {
		position: absolute;
		inset: 0.4rem;
		border: 1px dashed color-mix(in srgb, var(--tile-accent) 35%, transparent);
		border-radius: 0.5rem;
		content: '';
		pointer-events: none;
	}

	.matrix-tile.entry::before,
	.matrix-tile.exit::before {
		position: absolute;
		z-index: 3;
		top: 0.26rem;
		display: grid;
		height: clamp(1rem, 3vw, 1.15rem);
		min-width: clamp(1.6rem, 6vw, 1.9rem);
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--tile-accent) 60%, transparent);
		border-radius: 999px;
		background: rgba(8, 6, 13, 0.88);
		color: white;
		font-family: var(--font-display);
		font-size: clamp(0.5rem, 2.2vw, 0.6rem);
		font-weight: 700;
		letter-spacing: 0.06em;
		content: 'IN';
		pointer-events: none;
	}

	.matrix-tile.entry::before {
		left: 0.28rem;
	}

	.matrix-tile.exit::before {
		right: 0.28rem;
		content: 'OUT';
	}

	.matrix-tile line {
		stroke: currentColor;
		stroke-width: 10;
		stroke-linecap: round;
	}

	.tile-core {
		fill: currentColor;
		filter: drop-shadow(0 0 4px currentColor);
	}

	.matrix-tile.flow-live {
		color: var(--flow-blue);
	}

	.matrix-tile.flow-live svg {
		animation: flow-wave 1.8s ease-in-out infinite;
		animation-delay: var(--flow-delay);
	}

	.matrix-tile.flow-complete svg {
		animation: none;
		filter: drop-shadow(0 0 8px var(--flow-blue));
	}

	.matrix-tile.flow-complete .tile-core {
		fill: #d6f1ff;
	}

	.flow-status {
		display: inline-flex;
		align-items: center;
		gap: 0.42rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		padding: 0.32rem 0.58rem;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-fog);
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		transition:
			color 220ms ease,
			border-color 220ms ease,
			background-color 220ms ease;
	}

	.flow-status-dot {
		width: 5px;
		height: 5px;
		flex: none;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 8px currentColor;
	}

	.flow-status.blocked {
		border-color: rgba(255, 184, 107, 0.18);
		background: rgba(255, 184, 107, 0.06);
		color: var(--color-signal);
	}

	.flow-status.connected {
		border-color: rgba(76, 201, 255, 0.3);
		background: rgba(76, 201, 255, 0.09);
		color: var(--flow-blue);
	}

	.flow-status.connected .flow-status-dot {
		animation: signal-pulse 1.2s ease-in-out infinite;
	}

	.rail {
		display: flex;
		flex: none;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		color: var(--color-fog);
		font-family: var(--font-display);
		font-size: 0.52rem;
		font-weight: 700;
		letter-spacing: 0.14em;
	}

	.rail-in {
		align-self: flex-start;
		margin-top: clamp(0.65rem, 2vw, 1rem);
	}

	.rail-out {
		align-self: flex-end;
		margin-bottom: clamp(0.65rem, 2vw, 1rem);
	}

	.rail-arrow {
		display: grid;
		place-items: center;
		color: var(--flow-blue);
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--flow-blue) 60%, transparent));
		animation: rail-flow 1.8s ease-in-out infinite;
	}

	.rail-out.live {
		color: var(--flow-blue);
	}

	.rail-out.live .rail-arrow {
		color: var(--flow-blue);
		filter: drop-shadow(0 0 9px var(--flow-blue));
	}

	.btn.route-ready {
		box-shadow:
			0 0 0 1px rgba(76, 201, 255, 0.32),
			0 0 26px rgba(76, 201, 255, 0.28),
			0 12px 36px rgba(161, 0, 255, 0.25);
	}

	.flash-toast {
		position: absolute;
		bottom: 0.4rem;
		left: 50%;
		z-index: 5;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		padding: 0.48rem 0.8rem;
		background: rgba(8, 6, 13, 0.92);
		color: var(--color-mist);
		font-size: 0.66rem;
		white-space: nowrap;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
		animation: toast-in 220ms var(--ease-out-expo) both;
	}

	.tool-btn {
		display: inline-flex;
		min-height: 2.5rem;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.085);
		border-radius: 999px;
		padding: 0.5rem 0.78rem;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-mist);
		font-size: 0.68rem;
		font-weight: 600;
		transition:
			background-color 180ms ease,
			color 180ms ease;
	}

	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.07);
		color: white;
	}

	.info-panel {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.1rem;
		background: rgba(20, 16, 29, 0.58);
	}

	.shortcut {
		display: grid;
		width: 1.6rem;
		height: 1.6rem;
		flex: none;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.45rem;
		background: rgba(255, 255, 255, 0.035);
		color: white;
		font-family: var(--font-display);
		font-size: 0.6rem;
		font-weight: 600;
	}

	.keycap {
		display: grid;
		height: 1.8rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 0.45rem;
		background: rgba(255, 255, 255, 0.03);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
	}

	@keyframes flow-wave {
		0%,
		100% {
			opacity: 0.62;
			filter: drop-shadow(0 0 3px currentColor);
		}
		24% {
			opacity: 1;
			filter: drop-shadow(0 0 10px currentColor);
		}
	}

	@keyframes rail-flow {
		0%,
		100% {
			transform: translateX(-2px);
			opacity: 0.65;
		}
		35% {
			transform: translateX(2px);
			opacity: 1;
		}
	}

	@keyframes signal-pulse {
		50% {
			opacity: 0.35;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.matrix-tile.flow-live svg,
		.rail-arrow,
		.flow-status.connected .flow-status-dot {
			animation: none;
		}
	}

	@media (min-width: 960px) {
		.play-grid {
			grid-template-columns: minmax(0, 1fr) 18.5rem;
			align-items: start;
		}
	}

	@media (min-width: 960px) and (max-height: 980px) {
		.matrix-frame {
			width: min(100%, 25rem);
		}

		.board-panel {
			padding: clamp(0.85rem, 1.6vw, 1.2rem);
		}
	}

	@media (min-width: 960px) and (max-height: 820px) {
		.matrix-frame {
			width: min(100%, 22rem);
		}

		.board-panel {
			padding: 0.85rem;
		}
	}

	@media (max-width: 520px) {
		.rail {
			display: none;
		}
	}
</style>
