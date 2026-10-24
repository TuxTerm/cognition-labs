<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowDown,
		ArrowLeft,
		ArrowRight,
		ArrowUp,
		DoorOpen,
		KeyRound,
		Lock,
		Map,
		ShieldQuestion,
		Sparkles
	} from '@lucide/svelte';
	import GameIntro from '#lib/components/games/GameIntro.svelte';
	import GameResults from '#lib/components/games/GameResults.svelte';
	import GameTopBar from '#lib/components/games/GameTopBar.svelte';
	import PauseOverlay from '#lib/components/games/PauseOverlay.svelte';
	import StartCountdown from '#lib/components/games/StartCountdown.svelte';
	import GameQuitDialog from '#lib/components/games/GameQuitDialog.svelte';
	import {
		MAZE_DIRECTIONS,
		MAZE_KEY_COUNTS,
		MAZE_SIZES,
		MAZE_TIME_MS,
		generateMaze,
		mazeScore,
		neighborFor,
		type HiddenMaze
	} from '#lib/games/hidden-maze/engine';
	import { mulberry32, randomSeed } from '#lib/games/shared/rng';
	import type { GameMeta } from '#lib/data/games';
	import type { GamePhase, GameResult } from '#lib/games/shared/types';
	import { startPageScroll, stopPageScroll } from '#lib/motion/lenis';
	import { formatClock } from '#lib/utils/format';
	import { progress, type RecordResult } from '#lib/stores/progress.svelte';

	type Props = { meta: GameMeta };
	let { meta }: Props = $props();

	let phase = $state<GamePhase>('intro');
	let mazes = $state<HiddenMaze[]>([]);
	let mazeIndex = $state(0);
	let position = $state(0);
	let explored = $state<number[]>([]);
	let collectedByMaze = $state<number[][]>([[], [], []]);
	let remaining = $state(MAZE_TIME_MS);
	let activeMs = $state(0);
	let mazesCleared = $state(0);
	let resets = $state(0);
	let locked = $state(false);
	let flash = $state('');
	let result = $state<GameResult | null>(null);
	let record = $state<RecordResult | null>(null);
	let confirmingQuit = $state(false);
	let wallHit = $state<number | null>(null);
	let deadline = 0;
	let raf = 0;
	let lastFrame = 0;
	let rng = mulberry32(randomSeed());
	let flashTimer: ReturnType<typeof setTimeout> | null = null;
	let wallTimer: ReturnType<typeof setTimeout> | null = null;
	let transitionTimer: ReturnType<typeof setTimeout> | null = null;

	const maze = $derived(mazes[mazeIndex]);
	const size = $derived(maze?.size ?? 5);
	const currentCollected = $derived(collectedByMaze[mazeIndex] ?? []);
	const keysCollected = $derived(collectedByMaze.reduce((total, keys) => total + keys.length, 0));
	const totalKeys = $derived(MAZE_KEY_COUNTS.reduce((total, count) => total + count, 0));
	const keysRemaining = $derived(
		maze ? maze.keys.filter((key) => !currentCollected.includes(key)) : []
	);
	const allKeysReady = $derived(keysRemaining.length === 0);
	const urgent = $derived(remaining <= 30_000);
	const timerProgress = $derived((remaining / MAZE_TIME_MS) * 100);

	onMount(() => {
		progress.load();
		return () => {
			cancelAnimationFrame(raf);
			if (flashTimer) clearTimeout(flashTimer);
			if (wallTimer) clearTimeout(wallTimer);
			if (transitionTimer) clearTimeout(transitionTimer);
			startPageScroll();
		};
	});

	function prepareRun(): void {
		cancelAnimationFrame(raf);
		if (flashTimer) clearTimeout(flashTimer);
		if (wallTimer) clearTimeout(wallTimer);
		if (transitionTimer) clearTimeout(transitionTimer);
		rng = mulberry32(randomSeed());
		mazes = MAZE_SIZES.map((mazeSize, index) =>
			generateMaze(mazeSize, MAZE_KEY_COUNTS[index] ?? 1, rng)
		);
		mazeIndex = 0;
		position = 0;
		explored = [0];
		collectedByMaze = MAZE_SIZES.map(() => []);
		remaining = MAZE_TIME_MS;
		activeMs = 0;
		mazesCleared = 0;
		resets = 0;
		locked = false;
		flash = '';
		wallHit = null;
		result = null;
		record = null;
	}

	function startDrill(): void {
		prepareRun();
		phase = 'countdown';
		stopPageScroll();
	}

	function startRun(): void {
		if (!mazes.length) prepareRun();
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

	function showFlash(message: string, ms = 1600): void {
		flash = message;
		if (flashTimer) clearTimeout(flashTimer);
		flashTimer = setTimeout(() => {
			flash = '';
		}, ms);
	}

	function targetFor(from: number, directionIndex: number): number | null {
		if (!maze) return null;
		const direction = MAZE_DIRECTIONS[directionIndex];
		if (!direction) return null;
		const x = from % maze.size;
		const y = Math.floor(from / maze.size);
		const nx = x + direction.dx;
		const ny = y + direction.dy;
		if (nx < 0 || ny < 0 || nx >= maze.size || ny >= maze.size) return null;
		return ny * maze.size + nx;
	}

	function flagWallHit(index: number): void {
		wallHit = index;
		if (wallTimer) clearTimeout(wallTimer);
		wallTimer = setTimeout(() => {
			wallHit = null;
		}, 700);
	}

	function move(directionIndex: number): void {
		if (phase !== 'playing' || locked || !maze) return;
		const next = neighborFor(maze, position, directionIndex);
		if (next === null) {
			const attempted = targetFor(position, directionIndex);
			resets += 1;
			if (attempted !== null) flagWallHit(attempted);
			position = maze.start;
			if (!explored.includes(maze.start)) explored = [...explored, maze.start];
			showFlash(attempted !== null ? 'Wall. Back to the start.' : 'Edge. Back to the start.');
			return;
		}

		if (wallTimer) {
			clearTimeout(wallTimer);
			wallTimer = null;
		}
		wallHit = null;
		position = next;
		if (!explored.includes(next)) explored = [...explored, next];

		if (maze.keys.includes(next) && !currentCollected.includes(next)) {
			collectedByMaze = collectedByMaze.map((keys, index) =>
				index === mazeIndex ? [...keys, next] : keys
			);
			showFlash('Key collected.');
		}

		if (next === maze.goal) {
			const collected = collectedByMaze[mazeIndex] ?? [];
			const hasAllKeys = maze.keys.every((key) => collected.includes(key));
			if (!hasAllKeys) {
				showFlash('Exit locked. Find every key.');
				return;
			}
			locked = true;
			mazesCleared += 1;
			if (mazeIndex >= mazes.length - 1) {
				finish();
				return;
			}
			showFlash(
				`Maze clear. Next grid: ${MAZE_SIZES[mazeIndex + 1]}×${MAZE_SIZES[mazeIndex + 1]}.`,
				2200
			);
			transitionTimer = setTimeout(() => {
				mazeIndex += 1;
				position = 0;
				explored = [0];
				locked = false;
				wallHit = null;
			}, 900);
		}
	}

	function directionTo(index: number): number {
		if (!maze) return -1;
		const x = position % maze.size;
		const y = Math.floor(position / maze.size);
		const tx = index % maze.size;
		const ty = Math.floor(index / maze.size);
		if (tx === x && ty === y - 1) return 0;
		if (tx === x + 1 && ty === y) return 1;
		if (tx === x && ty === y + 1) return 2;
		if (tx === x - 1 && ty === y) return 3;
		return -1;
	}

	function selectCell(index: number): void {
		if (phase !== 'playing' || locked || index === position) return;
		const direction = directionTo(index);
		if (direction === -1) {
			showFlash('Move one tile at a time.');
			return;
		}
		move(direction);
	}

	function finish(): void {
		if (phase === 'results') return;
		cancelAnimationFrame(raf);
		if (transitionTimer) clearTimeout(transitionTimer);
		phase = 'results';
		startPageScroll();
		const score = mazeScore(mazesCleared, keysCollected, remaining, resets);
		const completion = mazesCleared / MAZE_SIZES.length;
		const keyRatio = keysCollected / totalKeys;
		const accuracy = Math.round(Math.min(100, completion * 70 + keyRatio * 30));
		result = {
			score,
			accuracy,
			durationMs: Math.round(activeMs),
			metrics: {
				mazes: mazesCleared,
				keys: keysCollected,
				resets,
				timeRemaining: Math.round(remaining / 1000)
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
		if (['arrowup', 'w'].includes(key)) {
			event.preventDefault();
			move(0);
		} else if (['arrowright', 'd'].includes(key)) {
			event.preventDefault();
			move(1);
		} else if (['arrowdown', 's'].includes(key)) {
			event.preventDefault();
			move(2);
		} else if (['arrowleft', 'a'].includes(key)) {
			event.preventDefault();
			move(3);
		}
	}

	const headline = $derived(
		!result
			? ''
			: result.score >= 90
				? 'Every wall mapped.'
				: mazesCleared === MAZE_SIZES.length
					? 'Every maze cleared.'
					: result.score >= 55
						? 'The map is taking shape.'
						: 'The dark won this one.'
	);
	const summary = $derived(
		!result
			? ''
			: `You cleared ${mazesCleared} of ${MAZE_SIZES.length} mazes and collected ${keysCollected} of ${totalKeys} keys with ${resets} wall ${resets === 1 ? 'reset' : 'resets'}. The route you remember matters more than the route you see.`
	);
	const resultStats = $derived(
		!result
			? []
			: [
					{ label: 'Mazes cleared', value: `${mazesCleared} / ${MAZE_SIZES.length}` },
					{ label: 'Keys collected', value: `${keysCollected} / ${totalKeys}` },
					{ label: 'Wall resets', value: String(resets) },
					{ label: 'Time left', value: formatClock(remaining) }
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
			levelLabel={`Maze ${mazeIndex + 1} of ${MAZE_SIZES.length} · ${size}×${size}`}
			timer={formatClock(remaining)}
			progress={timerProgress}
			{urgent}
			onPause={pause}
			onQuit={requestQuit}
			stats={topStats}
		/>

		<main class="lab-container-wide px-4 pt-[calc(74px+1.25rem)] pb-10 sm:pt-[calc(74px+2rem)]">
			<div class="play-grid">
				<section class="maze-panel noise">
					<div class="relative z-10">
						<div class="flex flex-wrap items-end justify-between gap-4">
							<div>
								<div class="eyebrow">No walls visible</div>
								<h1
									class="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-none font-semibold tracking-[-0.05em] text-white"
								>
									Remember the route.
								</h1>
							</div>
							<div class={`key-status ${allKeysReady ? 'unlocked' : ''}`}>
								{#if allKeysReady}
									<DoorOpen size={14} />
									Exit unlocked
								{:else}
									<Lock size={13} />
									{keysRemaining.length}
									{keysRemaining.length === 1 ? 'key' : 'keys'} left
								{/if}
							</div>
						</div>

						<div class="relative mt-7">
							<div class="maze-frame">
								<div class="maze-grid" style={`--n: ${size}`}>
									{#each [...Array(size * size).keys()] as index (index)}
										{@const isCurrent = position === index}
										{@const isExplored = explored.includes(index)}
										{@const hasKey =
											maze?.keys.includes(index) && !currentCollected.includes(index)}
										{@const isGoal = maze?.goal === index}
										{@const isStart = maze?.start === index}
										{@const adjacent = directionTo(index) !== -1}
										<button
											type="button"
											class="maze-cell"
											class:is-current={isCurrent}
											class:is-explored={isExplored && !isCurrent}
											class:is-adjacent={adjacent && !isCurrent}
											class:is-goal={isGoal}
											class:is-start={isStart}
											class:is-wall-hit={wallHit === index}
											class:is-locked={isGoal && !allKeysReady}
											aria-label={`${isCurrent ? 'You are here. ' : ''}${hasKey ? 'Key. ' : ''}${isGoal ? 'Exit. ' : ''}Row ${Math.floor(index / size) + 1}, column ${(index % size) + 1}`}
											onclick={() => selectCell(index)}
										>
											{#if isCurrent}
												<span class="player-orb" aria-hidden="true"></span>
											{:else if hasKey}
												<span class="key-token"><KeyRound size={14} /></span>
											{:else if isGoal}
												<span class="goal-token">
													{#if allKeysReady}
														<DoorOpen size={16} />
													{:else}
														<Lock size={14} />
													{/if}
												</span>
											{:else if isStart}
												<span class="start-token">S</span>
											{:else if isExplored}
												<span class="trail-dot" aria-hidden="true"></span>
											{/if}
											{#if wallHit === index}
												<span class="wall-hit-mark" aria-hidden="true"></span>
											{/if}
										</button>
									{/each}
								</div>
							</div>

							{#if flash}
								<div class="flash-toast">{flash}</div>
							{/if}
						</div>

						<div
							class="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.065] pt-4"
						>
							<div class="flex flex-wrap items-center gap-3 text-[0.63rem] text-fog">
								<span class="inline-flex items-center gap-1.5"
									><span class="legend-dot player"></span> You</span
								>
								<span class="inline-flex items-center gap-1.5"
									><span class="legend-dot explored"></span> Explored</span
								>
								<span class="inline-flex items-center gap-1.5"><KeyRound size={11} /> Key</span>
								<span class="inline-flex items-center gap-1.5"><DoorOpen size={11} /> Exit</span>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="text-[0.56rem] tracking-[0.12em] text-fog uppercase">Move</span>
								<span class="keycap"><ArrowUp size={12} /></span>
								<span class="keycap"><ArrowRight size={12} /></span>
								<span class="keycap"><ArrowDown size={12} /></span>
								<span class="keycap"><ArrowLeft size={12} /></span>
							</div>
						</div>
					</div>
				</section>

				<aside class="space-y-3">
					<div class="info-panel">
						<div class="flex items-center justify-between gap-3">
							<span class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
								>Run status</span
							>
							<Map size={14} class="text-mint" />
						</div>
						<div class="mt-4 grid grid-cols-2 gap-3">
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Mazes</div>
								<div class="mt-1 font-display text-2xl text-white">
									{mazesCleared}<span class="text-sm text-fog"> / {MAZE_SIZES.length}</span>
								</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Keys</div>
								<div class="mt-1 font-display text-2xl text-white">
									{keysCollected}<span class="text-sm text-fog"> / {totalKeys}</span>
								</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Resets</div>
								<div class="mt-1 font-display text-lg text-white">{resets}</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Maze</div>
								<div class="mt-1 font-display text-lg text-white">
									{mazeIndex + 1} / {MAZE_SIZES.length}
								</div>
							</div>
						</div>
					</div>

					<div class="info-panel">
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase">
							This maze
						</div>
						<div class="mt-4 flex flex-wrap gap-2">
							{#each [...Array(maze?.keys.length ?? 0).keys()] as index (index)}
								{@const key = maze?.keys[index]}
								<span
									class={`key-slot ${key !== undefined && currentCollected.includes(key) ? 'found' : ''}`}
									aria-label={key !== undefined && currentCollected.includes(key)
										? 'Key found'
										: 'Key missing'}
								>
									<KeyRound size={13} />
								</span>
							{/each}
							{#if allKeysReady}
								<span class="key-slot exit-ready"><DoorOpen size={13} /></span>
							{/if}
						</div>
						<p class="mt-4 text-[0.68rem] leading-5 text-fog">
							Keys appear in the maze. The exit is always visible — but it will not open until every
							key in this grid is collected.
						</p>
					</div>

					<div class="info-panel">
						<div
							class="flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
						>
							<ShieldQuestion size={13} class="text-mint" />
							Wall rule
						</div>
						<p class="mt-3 text-[0.68rem] leading-5 text-fog">
							Walls are invisible. A blocked move flashes the wall cell red and sends you back to
							the start, but your explored trail stays marked. Use it to build a mental map.
						</p>
						<div
							class="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[0.62rem] text-mist"
						>
							<Sparkles size={12} class="text-mint" />
							Click an adjacent tile or use arrows / WASD.
						</div>
					</div>
				</aside>
			</div>
		</main>

		{#if phase === 'countdown'}
			<StartCountdown onComplete={startRun} label="No map. Just memory." />
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
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Maze</div>
			<div class="mt-1 font-display text-sm text-white">
				{mazeIndex + 1} / {MAZE_SIZES.length}
			</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Keys</div>
			<div class="mt-1 font-display text-sm text-white">{keysCollected} / {totalKeys}</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Resets</div>
			<div class="mt-1 font-display text-sm text-white">{resets}</div>
		</div>
	</div>
{/snippet}

<style>
	.play-shell {
		min-height: 100svh;
		background:
			radial-gradient(ellipse 55% 40% at 50% 0%, var(--accent-soft), transparent 68%),
			var(--color-void);
	}

	.play-grid {
		display: grid;
		gap: 1rem;
	}

	.maze-panel {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.6rem;
		padding: clamp(1rem, 2.5vw, 1.6rem);
		background:
			linear-gradient(150deg, rgba(255, 255, 255, 0.035), transparent 42%), rgba(14, 11, 20, 0.8);
		box-shadow: 0 30px 100px rgba(0, 0, 0, 0.28);
	}

	.key-status {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 999px;
		padding: 0.45rem 0.7rem;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-mist);
		font-size: 0.65rem;
		font-weight: 600;
	}

	.key-status.unlocked {
		border-color: rgba(94, 234, 212, 0.3);
		background: rgba(94, 234, 212, 0.08);
		color: var(--color-mint);
	}

	.maze-frame {
		width: min(100%, 33rem);
		margin-inline: auto;
		padding: clamp(0.6rem, 2vw, 0.9rem);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.3rem;
		background:
			radial-gradient(circle at 50% 45%, rgba(94, 234, 212, 0.055), transparent 70%),
			rgba(5, 4, 9, 0.72);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
	}

	.maze-grid {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: clamp(0.2rem, 1vw, 0.45rem);
		aspect-ratio: 1;
	}

	.maze-cell {
		position: relative;
		display: grid;
		min-width: 0;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: clamp(0.35rem, 1.2vw, 0.65rem);
		background: rgba(255, 255, 255, 0.018);
		color: var(--color-fog);
		transition:
			background-color 160ms ease,
			border-color 160ms ease,
			transform 160ms var(--ease-out-expo);
	}

	.maze-cell.is-explored {
		border-color: rgba(94, 234, 212, 0.1);
		background:
			radial-gradient(circle at center, rgba(94, 234, 212, 0.1), transparent 68%),
			rgba(94, 234, 212, 0.025);
	}

	.maze-cell.is-adjacent {
		border-color: rgba(255, 255, 255, 0.13);
		background: rgba(255, 255, 255, 0.035);
	}

	.maze-cell.is-adjacent:hover {
		border-color: rgba(94, 234, 212, 0.35);
		background: rgba(94, 234, 212, 0.07);
		transform: translateY(-1px);
	}

	.maze-cell.is-current {
		border-color: rgba(183, 247, 216, 0.4);
		background: rgba(94, 234, 212, 0.1);
		box-shadow:
			0 0 0 1px rgba(183, 247, 216, 0.16),
			0 0 24px rgba(94, 234, 212, 0.14);
	}

	.maze-cell.is-goal {
		border-color: rgba(199, 125, 255, 0.24);
		background: rgba(161, 0, 255, 0.07);
		color: var(--color-violet-soft);
	}

	.maze-cell.is-goal.is-locked {
		border-color: rgba(255, 255, 255, 0.09);
		background: rgba(255, 255, 255, 0.025);
		color: var(--color-fog);
	}

	.maze-cell.is-start {
		border-color: rgba(94, 234, 212, 0.18);
	}

	.maze-cell.is-wall-hit {
		border-color: rgba(255, 92, 92, 0.85);
		background: rgba(255, 64, 64, 0.24);
		box-shadow:
			0 0 0 1px rgba(255, 92, 92, 0.5),
			0 0 28px rgba(255, 64, 64, 0.5);
		color: #ffdada;
		animation: wall-hit 700ms var(--ease-out-expo) both;
	}

	.wall-hit-mark {
		position: absolute;
		inset: 18%;
		border: 2px solid rgba(255, 120, 120, 0.85);
		border-radius: inherit;
		box-shadow: 0 0 16px rgba(255, 64, 64, 0.7);
		animation: wall-hit-mark 700ms ease-out both;
	}

	.player-orb {
		width: clamp(0.6rem, 2.4vw, 0.9rem);
		height: clamp(0.6rem, 2.4vw, 0.9rem);
		border-radius: 999px;
		background: #eafff6;
		box-shadow:
			0 0 0 4px rgba(183, 247, 216, 0.14),
			0 0 22px rgba(183, 247, 216, 0.8);
		animation: orb-pulse 2.4s ease-in-out infinite;
	}

	.key-token {
		display: grid;
		place-items: center;
		color: #ffd28a;
		filter: drop-shadow(0 0 7px rgba(255, 184, 107, 0.65));
		animation: key-float 3s ease-in-out infinite;
	}

	.goal-token {
		display: grid;
		place-items: center;
	}

	.start-token {
		font-family: var(--font-display);
		font-size: clamp(0.5rem, 1.6vw, 0.65rem);
		font-weight: 700;
		color: rgba(183, 247, 216, 0.5);
	}

	.trail-dot {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: rgba(94, 234, 212, 0.45);
		box-shadow: 0 0 8px rgba(94, 234, 212, 0.3);
	}

	.flash-toast {
		position: absolute;
		bottom: 0.2rem;
		left: 50%;
		z-index: 5;
		transform: translateX(-50%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		padding: 0.48rem 0.8rem;
		background: rgba(8, 6, 13, 0.94);
		color: var(--color-mist);
		font-size: 0.66rem;
		white-space: nowrap;
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
		animation: toast-in 220ms var(--ease-out-expo) both;
	}

	.legend-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
	}

	.legend-dot.player {
		background: var(--color-mint);
		box-shadow: 0 0 7px var(--color-mint);
	}

	.legend-dot.explored {
		background: rgba(94, 234, 212, 0.3);
	}

	.keycap {
		display: grid;
		width: 1.55rem;
		height: 1.55rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 0.4rem;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-mist);
	}

	.info-panel {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.1rem;
		background: rgba(20, 16, 29, 0.58);
	}

	.key-slot {
		display: grid;
		width: 1.9rem;
		height: 1.9rem;
		place-items: center;
		border: 1px solid rgba(255, 184, 107, 0.2);
		border-radius: 0.55rem;
		background: rgba(255, 184, 107, 0.07);
		color: #ffcf95;
	}

	.key-slot.found {
		border-color: rgba(183, 247, 216, 0.2);
		background: rgba(183, 247, 216, 0.07);
		color: var(--color-mint);
		opacity: 0.55;
	}

	.key-slot.exit-ready {
		border-color: rgba(94, 234, 212, 0.28);
		color: var(--color-mint);
	}

	@keyframes orb-pulse {
		50% {
			box-shadow:
				0 0 0 7px rgba(183, 247, 216, 0.06),
				0 0 30px rgba(183, 247, 216, 0.9);
		}
	}

	@keyframes key-float {
		50% {
			transform: translateY(-2px);
		}
	}

	@keyframes wall-hit {
		0% {
			transform: scale(1);
		}
		28% {
			transform: scale(0.94);
		}
		55% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes wall-hit-mark {
		0% {
			opacity: 0.95;
			transform: scale(0.7);
		}
		100% {
			opacity: 0;
			transform: scale(1.35);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.maze-cell.is-wall-hit,
		.wall-hit-mark {
			animation: none;
		}
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
	}

	@media (min-width: 960px) {
		.play-grid {
			grid-template-columns: minmax(0, 1fr) 18.5rem;
			align-items: start;
		}
	}
</style>
