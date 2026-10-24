<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { ArrowUpRight, Flame, Gauge, Sparkles, Target, TimerReset } from '@lucide/svelte';
	import GameIntro from '#lib/components/games/GameIntro.svelte';
	import GameResults from '#lib/components/games/GameResults.svelte';
	import GameTopBar from '#lib/components/games/GameTopBar.svelte';
	import PauseOverlay from '#lib/components/games/PauseOverlay.svelte';
	import StartCountdown from '#lib/components/games/StartCountdown.svelte';
	import GameQuitDialog from '#lib/components/games/GameQuitDialog.svelte';
	import {
		SPRINT_MS,
		WRONG_PENALTY_MS,
		clickAccuracy,
		generateSet,
		sprintScore,
		type Balloon,
		type BalloonSet
	} from '#lib/games/balloon-math/engine';
	import { mulberry32, randomSeed } from '#lib/games/shared/rng';
	import type { GameMeta } from '#lib/data/games';
	import type { GamePhase, GameResult } from '#lib/games/shared/types';
	import { startPageScroll, stopPageScroll } from '#lib/motion/lenis';
	import { formatClock } from '#lib/utils/format';
	import { progress, type RecordResult } from '#lib/stores/progress.svelte';

	type Props = { meta: GameMeta };
	let { meta }: Props = $props();

	let phase = $state<GamePhase>('intro');
	let currentSet = $state<BalloonSet | null>(null);
	let popped = $state<string[]>([]);
	let wrongId = $state('');
	let remaining = $state(SPRINT_MS);
	let activeMs = $state(0);
	let correct = $state(0);
	let wrong = $state(0);
	let setsCleared = $state(0);
	let combo = $state(0);
	let bestCombo = $state(0);
	let locked = $state(false);
	let result = $state<GameResult | null>(null);
	let record = $state<RecordResult | null>(null);
	let confirmingQuit = $state(false);
	let responseTotal = 0;
	let responseCount = 0;
	let setStartedAt = 0;
	let lastPopAt = 0;
	let deadline = 0;
	let raf = 0;
	let lastFrame = 0;
	let rng = mulberry32(randomSeed());
	let transitionTimer: ReturnType<typeof setTimeout> | null = null;
	let wrongTimer: ReturnType<typeof setTimeout> | null = null;

	const level = $derived(Math.min(3, 1 + Math.floor(setsCleared / 3)));
	const urgent = $derived(remaining <= 15_000);
	const timerProgress = $derived((remaining / SPRINT_MS) * 100);
	const accuracy = $derived(clickAccuracy(correct, wrong));
	const avgResponse = $derived(responseCount > 0 ? responseTotal / responseCount / 1000 : 0);
	const poppedCount = $derived(popped.length);

	onMount(() => {
		progress.load();
		return () => {
			cancelAnimationFrame(raf);
			if (transitionTimer) clearTimeout(transitionTimer);
			if (wrongTimer) clearTimeout(wrongTimer);
			startPageScroll();
		};
	});

	function nextSet(resetTimer = false): void {
		const setId = `set-${setsCleared}-${Math.floor(rng() * 1_000_000)}`;
		currentSet = generateSet(level, rng, setId);
		popped = [];
		locked = false;
		setStartedAt = performance.now();
		lastPopAt = 0;
		if (resetTimer) {
			remaining = SPRINT_MS;
			deadline = performance.now() + remaining;
			lastFrame = performance.now();
		}
	}

	function prepareRun(): void {
		cancelAnimationFrame(raf);
		if (transitionTimer) clearTimeout(transitionTimer);
		if (wrongTimer) clearTimeout(wrongTimer);
		rng = mulberry32(randomSeed());
		remaining = SPRINT_MS;
		activeMs = 0;
		correct = 0;
		wrong = 0;
		setsCleared = 0;
		combo = 0;
		bestCombo = 0;
		popped = [];
		wrongId = '';
		locked = false;
		result = null;
		record = null;
		responseTotal = 0;
		responseCount = 0;
		nextSet();
	}

	function startDrill(): void {
		prepareRun();
		phase = 'countdown';
		stopPageScroll();
	}

	function startRun(): void {
		if (!currentSet) nextSet();
		phase = 'playing';
		lastFrame = performance.now();
		deadline = lastFrame + remaining;
		setStartedAt = lastFrame;
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

	function popBalloon(balloon: Balloon): void {
		if (phase !== 'playing' || locked || !currentSet || popped.includes(balloon.id)) return;
		const expected = currentSet.order[popped.length];
		const now = performance.now();
		if (balloon.id === expected) {
			responseTotal += now - (lastPopAt || setStartedAt);
			responseCount += 1;
			lastPopAt = now;
			correct += 1;
			popped = [...popped, balloon.id];

			if (popped.length === currentSet.balloons.length) {
				locked = true;
				setsCleared += 1;
				combo += 1;
				bestCombo = Math.max(bestCombo, combo);
				transitionTimer = setTimeout(() => {
					nextSet();
				}, 420);
			}
			return;
		}

		wrong += 1;
		combo = 0;
		wrongId = balloon.id;
		remaining = Math.max(0, remaining - WRONG_PENALTY_MS);
		deadline -= WRONG_PENALTY_MS;
		lastPopAt = 0;
		if (wrongTimer) clearTimeout(wrongTimer);
		wrongTimer = setTimeout(() => {
			wrongId = '';
		}, 480);
		if (remaining <= 0) finish();
	}

	function finish(): void {
		if (phase === 'results') return;
		cancelAnimationFrame(raf);
		if (transitionTimer) clearTimeout(transitionTimer);
		if (wrongTimer) clearTimeout(wrongTimer);
		phase = 'results';
		startPageScroll();
		const score = sprintScore(setsCleared, correct, wrong);
		result = {
			score,
			accuracy: clickAccuracy(correct, wrong),
			durationMs: Math.round(activeMs),
			metrics: {
				sets: setsCleared,
				bestCombo,
				wrong,
				avgResponse: Number(avgResponse.toFixed(1))
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
		if (wrongTimer) clearTimeout(wrongTimer);
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
		if (event.key === 'Escape') {
			event.preventDefault();
			pause();
			return;
		}
		if (!currentSet) return;
		const index = ['1', '2', '3'].indexOf(event.key);
		if (index === -1) return;
		event.preventDefault();
		const balloon = currentSet.balloons[index];
		if (balloon) popBalloon(balloon);
	}

	const headline = $derived(
		!result
			? ''
			: result.score >= 90
				? 'Numbers, handled.'
				: result.score >= 70
					? 'Fast and accurate.'
					: setsCleared >= 4
						? 'Good pace. Tighter choices next.'
						: 'The clock got the edge.'
	);
	const summary = $derived(
		!result
			? ''
			: `You cleared ${setsCleared} ${setsCleared === 1 ? 'set' : 'sets'} with ${accuracy}% click accuracy and a best combo of ${bestCombo}. Every wrong pop cost three seconds — the clock was part of the test.`
	);
	const resultStats = $derived(
		!result
			? []
			: [
					{ label: 'Sets cleared', value: String(setsCleared) },
					{ label: 'Correct pops', value: String(correct) },
					{ label: 'Wrong pops', value: String(wrong) },
					{ label: 'Avg response', value: `${avgResponse.toFixed(1)}s` }
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
			levelLabel={`Set ${setsCleared + 1} · difficulty ${level}`}
			timer={formatClock(remaining)}
			progress={timerProgress}
			{urgent}
			onPause={pause}
			onQuit={requestQuit}
			stats={topStats}
		/>

		<main class="lab-container-wide px-4 pt-[calc(74px+1.25rem)] pb-10 sm:pt-[calc(74px+2rem)]">
			<div class="play-grid">
				<section class="balloon-panel noise">
					<div class="relative z-10">
						<div class="flex flex-wrap items-end justify-between gap-4">
							<div>
								<div class="eyebrow">Pop in ascending order</div>
								<h1
									class="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-none font-semibold tracking-[-0.05em] text-white"
								>
									Lowest answer first.
								</h1>
							</div>
							<div class="order-track">
								{#each [0, 1, 2] as slot (slot)}
									<span class:filled={poppedCount > slot}>{slot + 1}</span>
								{/each}
							</div>
						</div>

						{#if currentSet}
							<div class="balloon-stage">
								<div class="balloon-row">
									{#each currentSet.balloons as balloon, index (balloon.id)}
										<button
											type="button"
											class={`balloon balloon-${balloon.tone}`}
											class:is-popped={popped.includes(balloon.id)}
											class:is-wrong={wrongId === balloon.id}
											aria-label={`Balloon ${index + 1}: ${balloon.expression}`}
											onclick={() => popBalloon(balloon)}
											disabled={locked}
										>
											<span class="balloon-key">{index + 1}</span>
											<span class="balloon-shine" aria-hidden="true"></span>
											<span class="balloon-expression">{balloon.expression}</span>
											<span class="balloon-knot" aria-hidden="true"></span>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<div
							class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.065] pt-4"
						>
							<div class="flex flex-wrap gap-3 text-[0.65rem] text-fog">
								<span class="inline-flex items-center gap-1.5"
									><Target size={12} /> Evaluate all three</span
								>
								<span class="inline-flex items-center gap-1.5"
									><Flame size={12} class="text-signal" /> Wrong pop: −3s</span
								>
								<span class="inline-flex items-center gap-1.5"
									><TimerReset size={12} /> 90-second sprint</span
								>
							</div>
							<div class="flex items-center gap-1.5">
								<span class="text-[0.58rem] tracking-[0.13em] text-fog uppercase">Keys</span>
								{#each ['1', '2', '3'] as key (key)}
									<span class="keycap">{key}</span>
								{/each}
							</div>
						</div>
					</div>
				</section>

				<aside class="space-y-3">
					<div class="info-panel">
						<div class="flex items-center justify-between gap-3">
							<span class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
								>Sprint score</span
							>
							<Gauge size={14} class="text-signal" />
						</div>
						<div class="mt-4 grid grid-cols-2 gap-3">
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Sets</div>
								<div class="mt-1 font-display text-2xl text-white">{setsCleared}</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Combo</div>
								<div class="mt-1 font-display text-2xl text-white">
									{combo}<span class="text-sm text-signal">×</span>
								</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Accuracy</div>
								<div class="mt-1 font-display text-lg text-white">{accuracy}%</div>
							</div>
							<div>
								<div class="text-[0.58rem] tracking-[0.14em] text-fog uppercase">Best combo</div>
								<div class="mt-1 font-display text-lg text-white">{bestCombo}×</div>
							</div>
						</div>
					</div>

					<div class="info-panel">
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase">The rule</div>
						<div class="mt-4 space-y-3">
							{#each ['Calculate each expression, not the digits you see.', 'Pop from the lowest answer to the highest.', 'A wrong pop costs 3 seconds and breaks the combo.', 'A complete set loads three fresh balloons.'] as rule, index (rule)}
								<div class="flex gap-3">
									<span class="font-display text-[0.58rem] font-bold text-signal">0{index + 1}</span
									>
									<p class="text-[0.68rem] leading-5 text-mist">{rule}</p>
								</div>
							{/each}
						</div>
					</div>

					<div class="info-panel">
						<div
							class="flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
						>
							<Sparkles size={13} class="text-signal" />
							Pace note
						</div>
						<p class="mt-3 text-[0.68rem] leading-5 text-fog">
							Speed matters, but accuracy is weighted more heavily. One calm set beats three rushed
							guesses.
						</p>
						<a
							href={resolve('/about')}
							class="mt-4 inline-flex items-center gap-1.5 text-[0.68rem] font-semibold text-white"
						>
							How scoring works
							<ArrowUpRight size={13} />
						</a>
					</div>
				</aside>
			</div>
		</main>

		{#if phase === 'countdown'}
			<StartCountdown onComplete={startRun} label="Eyes on the numbers" />
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
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Sets</div>
			<div class="mt-1 font-display text-sm text-white">{setsCleared}</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Combo</div>
			<div class="mt-1 font-display text-sm text-white">{combo}×</div>
		</div>
		<div>
			<div class="text-[0.52rem] font-bold tracking-[0.14em] text-fog uppercase">Wrong</div>
			<div class="mt-1 font-display text-sm text-white">{wrong}</div>
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

	.balloon-panel {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.6rem;
		padding: clamp(1rem, 2.5vw, 1.6rem);
		background:
			linear-gradient(150deg, rgba(255, 255, 255, 0.035), transparent 42%), rgba(14, 11, 20, 0.8);
		box-shadow: 0 30px 100px rgba(0, 0, 0, 0.28);
	}

	.order-track {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.order-track span {
		display: grid;
		width: 1.7rem;
		height: 1.7rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		color: var(--color-fog);
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 600;
		transition:
			background-color 200ms ease,
			color 200ms ease,
			border-color 200ms ease;
	}

	.order-track span.filled {
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		background: var(--accent);
		color: #08060d;
	}

	.balloon-stage {
		position: relative;
		margin-top: 2rem;
		min-height: 22rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.balloon-row {
		display: grid;
		width: 100%;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(0.5rem, 2vw, 1.3rem);
	}

	.balloon {
		position: relative;
		display: flex;
		width: 100%;
		min-width: 0;
		aspect-ratio: 0.84;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 50% 50% 48% 48% / 43% 43% 57% 57%;
		padding: 1rem;
		color: white;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.2),
			0 26px 60px rgba(0, 0, 0, 0.3);
		transition:
			transform 220ms var(--ease-out-expo),
			opacity 220ms ease,
			filter 220ms ease;
		animation: balloon-in 500ms var(--ease-out-expo) both;
	}

	.balloon:nth-child(2) {
		animation-delay: 60ms;
	}

	.balloon:nth-child(3) {
		animation-delay: 120ms;
	}

	.balloon:hover {
		transform: translateY(-8px) scale(1.015);
	}

	.balloon-violet {
		background:
			radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.42), transparent 18%),
			radial-gradient(circle at 58% 62%, #c77dff, #7c3aed 52%, #3b0764 100%);
	}

	.balloon-amber {
		background:
			radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.48), transparent 18%),
			radial-gradient(circle at 58% 62%, #ffd8a3, #ffb86b 52%, #9a4b00 100%);
	}

	.balloon-mint {
		background:
			radial-gradient(circle at 32% 22%, rgba(255, 255, 255, 0.42), transparent 18%),
			radial-gradient(circle at 58% 62%, #b7f7d8, #5eead4 52%, #115e59 100%);
	}

	.balloon:nth-child(2) {
		transform: translateY(1.4rem) scale(0.96);
	}

	.balloon:nth-child(2):hover {
		transform: translateY(0.7rem) scale(0.975);
	}

	.balloon:nth-child(3) {
		transform: translateY(0.35rem);
	}

	.balloon:nth-child(3):hover {
		transform: translateY(-0.4rem) scale(1.015);
	}

	.balloon.is-popped {
		pointer-events: none;
		opacity: 0;
		transform: translateY(-24px) scale(1.18) !important;
	}

	.balloon.is-wrong {
		animation: balloon-shake 360ms ease both;
		filter: saturate(1.1) brightness(1.08);
	}

	.balloon-key {
		position: absolute;
		top: 1rem;
		left: 50%;
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		transform: translateX(-50%);
		place-items: center;
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.18);
		color: rgba(255, 255, 255, 0.9);
		font-family: var(--font-display);
		font-size: 0.6rem;
		font-weight: 700;
	}

	.balloon-expression {
		position: relative;
		z-index: 2;
		max-width: 100%;
		color: #fff;
		font-family: var(--font-display);
		font-size: clamp(0.9rem, 2.1vw, 1.55rem);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.04em;
		text-align: center;
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.35);
		overflow-wrap: anywhere;
	}

	.balloon-shine {
		position: absolute;
		top: 14%;
		left: 19%;
		width: 18%;
		height: 10%;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.58);
		filter: blur(1px);
		transform: rotate(-34deg);
	}

	.balloon-knot {
		position: absolute;
		bottom: -0.35rem;
		left: 50%;
		width: 0;
		height: 0;
		transform: translateX(-50%);
		border-right: 0.35rem solid transparent;
		border-bottom: 0.55rem solid rgba(255, 255, 255, 0.38);
		border-left: 0.35rem solid transparent;
	}

	.keycap {
		display: grid;
		width: 1.55rem;
		height: 1.55rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.4rem;
		background: rgba(255, 255, 255, 0.035);
		color: var(--color-mist);
		font-family: var(--font-display);
		font-size: 0.58rem;
		font-weight: 600;
	}

	.info-panel {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.1rem;
		background: rgba(20, 16, 29, 0.58);
	}

	@keyframes balloon-in {
		from {
			opacity: 0;
			transform: translateY(26px) scale(0.92);
		}
	}

	@keyframes balloon-shake {
		20% {
			transform: translateX(-6px);
		}
		40% {
			transform: translateX(6px);
		}
		60% {
			transform: translateX(-4px);
		}
		80% {
			transform: translateX(4px);
		}
	}

	@media (min-width: 960px) {
		.play-grid {
			grid-template-columns: minmax(0, 1fr) 18.5rem;
			align-items: start;
		}

		.balloon-stage {
			min-height: 27rem;
		}
	}

	@media (max-width: 640px) {
		.balloon-stage {
			min-height: 12.5rem;
			margin-top: 1.25rem;
		}

		.balloon-row {
			gap: 0.4rem;
		}

		.balloon {
			padding: 0.55rem;
		}

		.balloon:nth-child(2),
		.balloon:nth-child(3) {
			transform: none;
		}

		.balloon:nth-child(2):hover,
		.balloon:nth-child(3):hover {
			transform: translateY(-4px);
		}

		.balloon-key {
			top: 0.55rem;
			width: 1.15rem;
			height: 1.15rem;
			font-size: 0.5rem;
		}
	}
</style>
