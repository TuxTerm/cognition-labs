<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		ArrowRight,
		ArrowUpRight,
		BarChart3,
		CalendarDays,
		Flame,
		History,
		RotateCcw,
		ShieldCheck,
		Sparkles,
		Target,
		Trash2,
		Trophy,
		X
	} from '@lucide/svelte';
	import DrillCard from '#lib/components/DrillCard.svelte';
	import GameIcon from '#lib/components/GameIcon.svelte';
	import ProgressRing from '#lib/components/ProgressRing.svelte';
	import { GAMES, SKILLS } from '#lib/data/games';
	import { formatDate, formatDuration, monthLabel, pluralize } from '#lib/utils/format';
	import { progress } from '#lib/stores/progress.svelte';

	let confirmingReset = $state(false);
	let root: HTMLElement;

	const recommended = $derived(
		GAMES.find((game) => game.slug === progress.recommendedGame) ?? GAMES[0]
	);
	const recent = $derived(progress.recentAttempts);
	const totalTime = $derived(
		progress.attempts.reduce((total, attempt) => total + attempt.durationMs, 0)
	);
	const streak = $derived(progress.streak);

	onMount(() => {
		progress.load();
	});

	function resetProgress(): void {
		progress.reset();
		confirmingReset = false;
	}
</script>

<svelte:head>
	<title>Training floor — Cognitive Lab</title>
	<meta
		name="description"
		content="Your local cognitive training dashboard: readiness score, drill history, streak, and recommended next session."
	/>
</svelte:head>

<div class="dashboard" bind:this={root}>
	<section class="relative overflow-hidden border-b border-white/[0.055] pt-28 pb-12 sm:pt-32">
		<div class="dashboard-glow" aria-hidden="true"></div>
		<div class="lab-container-wide relative z-10">
			<div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
				<div>
					<div class="flex flex-wrap items-center gap-3">
						<div class="eyebrow">Training floor</div>
						<span class="tag">{monthLabel()}</span>
					</div>
					<h1
						class="mt-5 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.2rem)] leading-[0.9] font-semibold tracking-[-0.07em] text-white"
					>
						{progress.playedCount === 0 ? 'Establish your baseline.' : 'Sharpen the signal.'}
					</h1>
					<p class="mt-5 max-w-xl text-sm leading-7 text-mist">
						{progress.playedCount === 0
							? 'Run each drill once to calibrate your readiness score. Every result stays on this device.'
							: `${progress.playedCount} of 3 drills calibrated. Your next session is picked from the weakest signal in your profile.`}
					</p>
				</div>
				<div class="flex flex-wrap gap-2.5">
					<a href={resolve('/games/[slug]', { slug: recommended.slug })} class="btn btn-primary">
						<Sparkles size={16} />
						{progress.playedCount === 0 ? 'Start calibration' : 'Recommended drill'}
						<ArrowRight size={15} />
					</a>
					<button type="button" class="btn btn-secondary" onclick={() => (confirmingReset = true)}>
						<RotateCcw size={15} />
						Reset data
					</button>
				</div>
			</div>
		</div>
	</section>

	<section class="lab-container-wide -mt-1 pt-10 pb-20 sm:pt-14">
		<div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="readiness-panel noise">
				<div
					class="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"
				>
					<div>
						<div class="eyebrow">Cognitive readiness</div>
						<div class="mt-4 flex items-baseline gap-3">
							<span
								class="font-display text-[clamp(3.2rem,9vw,6rem)] leading-none font-semibold tracking-[-0.08em] text-white"
							>
								{progress.readiness}
							</span>
							<span class="text-sm text-fog">/ 100</span>
						</div>
						<div
							class="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-soft/25 bg-violet/10 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.13em] text-violet-soft uppercase"
						>
							<span class="size-1.5 rounded-full bg-violet-soft shadow-[0_0_8px_currentColor]"
							></span>
							{progress.readinessLabel}
						</div>
						<p class="mt-4 max-w-sm text-xs leading-6 text-fog">
							Weighted best-score average across logic (40%), numerical speed (30%), and spatial
							memory (30%). {progress.playedCount < 3
								? 'Provisional until all three drills are calibrated.'
								: 'All three signals are represented.'}
						</p>
					</div>
					<div class="relative shrink-0 self-center">
						<div class="absolute inset-0 rounded-full bg-violet/15 blur-3xl"></div>
						<ProgressRing value={progress.readiness} size={188} stroke={7} label="Readiness" />
					</div>
				</div>

				<div class="relative z-10 mt-8 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
					{#each SKILLS as skill (skill.key)}
						{@const value = progress.skillScores[skill.key]}
						<div>
							<div
								class="flex items-center justify-between gap-2 text-[0.62rem] font-semibold tracking-[0.13em] text-fog uppercase"
							>
								<span>{skill.label}</span>
								<span class="font-display text-white">{value ?? '—'}</span>
							</div>
							<div class="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
								<div
									class="h-full rounded-full bg-gradient-to-r from-violet-deep via-violet to-violet-soft transition-[width] duration-700"
									style:width={`${value ?? 0}%`}
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="stat-tile">
					<div class="stat-icon"><Target size={16} /></div>
					<div class="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
						{progress.totalAttempts}
					</div>
					<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">Total runs</div>
				</div>
				<div class="stat-tile">
					<div class="stat-icon"><Flame size={16} /></div>
					<div class="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
						{streak.current}
					</div>
					<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">Day streak</div>
				</div>
				<div class="stat-tile">
					<div class="stat-icon"><BarChart3 size={16} /></div>
					<div class="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
						{progress.totalAttempts > 0 ? formatDuration(totalTime) : '—'}
					</div>
					<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">Time trained</div>
				</div>
				<div class="stat-tile">
					<div class="stat-icon"><Trophy size={16} /></div>
					<div class="mt-6 font-display text-3xl font-semibold tracking-[-0.05em] text-white">
						{streak.longest}
					</div>
					<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">Longest streak</div>
				</div>
			</div>
		</div>

		<div class="mt-16 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
			<div>
				<div class="eyebrow">Your drills</div>
				<h2
					class="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.94] font-semibold tracking-[-0.055em] text-white"
				>
					The training floor
				</h2>
			</div>
			<div class="inline-flex items-center gap-2 text-[0.67rem] text-fog">
				<ShieldCheck size={13} />
				Local-first. Nothing leaves this browser.
			</div>
		</div>

		<div class="mt-7 grid gap-4 lg:grid-cols-3">
			{#each GAMES as game (game.slug)}
				<DrillCard
					{game}
					best={progress.bestFor(game.slug)}
					attempts={progress.statsFor(game.slug).attempts}
				/>
			{/each}
		</div>

		<div class="mt-16 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
			<div class="panel overflow-hidden">
				<div
					class="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6"
				>
					<div class="flex items-center gap-2.5">
						<History size={15} class="text-fog" />
						<h2 class="font-display text-base font-semibold tracking-[-0.025em] text-white">
							Recent runs
						</h2>
					</div>
					<span class="text-[0.62rem] tracking-[0.13em] text-fog uppercase"
						>Last {Math.min(6, progress.totalAttempts)}</span
					>
				</div>

				{#if recent.length === 0}
					<div class="flex flex-col items-center justify-center px-6 py-16 text-center">
						<div
							class="grid size-12 place-items-center rounded-2xl border border-line bg-white/[0.025] text-fog"
						>
							<History size={20} />
						</div>
						<h3 class="mt-5 font-display text-lg font-semibold text-white">No runs logged yet</h3>
						<p class="mt-2 max-w-xs text-xs leading-6 text-fog">
							Your first completed drill will appear here with score, accuracy, and duration.
						</p>
						<a
							href={resolve('/games/[slug]', { slug: recommended.slug })}
							class="btn btn-secondary mt-5 !min-h-10 !px-4 !py-2 text-xs"
						>
							Open {recommended.name}
							<ArrowUpRight size={14} />
						</a>
					</div>
				{:else}
					<div class="divide-y divide-white/[0.055]">
						{#each recent as attempt (attempt.id)}
							{@const game = GAMES.find((item) => item.slug === attempt.game)}
							<div class="flex items-center gap-3 px-4 py-3.5 sm:px-6">
								{#if game}
									<span
										class="grid size-9 shrink-0 place-items-center rounded-xl border"
										style={`--accent: ${game.accent}; --soft: ${game.softAccent}; border-color: color-mix(in srgb, ${game.accent} 25%, transparent); background: ${game.softAccent}; color: ${game.accent};`}
									>
										<GameIcon icon={game.icon} class="size-4" />
									</span>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="truncate text-xs font-medium text-white">
										{game?.name ?? attempt.game}
									</div>
									<div class="mt-1 flex items-center gap-1.5 text-[0.62rem] text-fog">
										<CalendarDays size={11} />
										{formatDate(attempt.playedAt)}
									</div>
								</div>
								<div class="hidden text-right sm:block">
									<div class="text-[0.62rem] text-fog">{attempt.accuracy}% accuracy</div>
									<div class="mt-1 text-[0.6rem] text-fog">
										{formatDuration(attempt.durationMs)}
									</div>
								</div>
								<div class="ml-2 w-14 text-right">
									<span class="font-display text-lg font-semibold text-white tabular-nums"
										>{attempt.score}</span
									>
									<span class="text-[0.6rem] text-fog">/100</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<aside class="recommend-card noise">
				<div class="relative z-10">
					<div class="flex items-center justify-between gap-3">
						<div class="eyebrow">Next best action</div>
						<span class="tag">AI-free logic</span>
					</div>
					<div class="mt-6 flex items-center gap-3">
						<span
							class="grid size-10 place-items-center rounded-xl border"
							style={`--accent: ${recommended.accent}; border-color: color-mix(in srgb, ${recommended.accent} 28%, transparent); background: ${recommended.softAccent}; color: ${recommended.accent};`}
						>
							<GameIcon icon={recommended.icon} class="size-5" />
						</span>
						<div>
							<div class="text-[0.58rem] font-bold tracking-[0.17em] text-fog uppercase">
								Recommended
							</div>
							<h2 class="mt-1 font-display text-xl font-semibold tracking-[-0.035em] text-white">
								{recommended.name}
							</h2>
						</div>
					</div>
					<p class="mt-5 text-xs leading-6 text-fog">
						{progress.playedCount === 0
							? 'Start here to establish the first signal in your readiness profile.'
							: progress.playedCount < 3
								? 'Calibrate this drill next so your readiness score covers all three skills.'
								: `Your lowest score is ${progress.bestFor(recommended.slug)}. One focused run could move your readiness index.`}
					</p>
					<div class="mt-5 space-y-2.5">
						{#each recommended.rules.slice(0, 3) as rule, index (rule)}
							<div class="flex gap-2.5 text-[0.68rem] leading-5 text-mist">
								<span class="font-display text-[0.58rem] font-bold text-violet-soft"
									>0{index + 1}</span
								>
								{rule}
							</div>
						{/each}
					</div>
					<a
						href={resolve('/games/[slug]', { slug: recommended.slug })}
						class="btn btn-primary mt-6 w-full"
					>
						Start {recommended.name}
						<ArrowRight size={15} />
					</a>
					<div class="mt-4 flex items-center justify-between text-[0.62rem] text-fog">
						<span>{recommended.duration}</span>
						<span>{progress.statsFor(recommended.slug).attempts} runs logged</span>
					</div>
				</div>
			</aside>
		</div>

		<div
			class="mt-8 flex flex-col gap-2 border-t border-white/[0.055] pt-5 text-[0.63rem] leading-5 text-fog sm:flex-row sm:items-center sm:justify-between"
		>
			<span>Readiness is a practice signal, not a clinical or employment assessment.</span>
			<span>{pluralize(progress.totalAttempts, 'run')} stored locally</span>
		</div>
	</section>
</div>

{#if confirmingReset}
	<div
		class="fixed inset-0 z-[130] grid place-items-center bg-black/75 p-5 backdrop-blur-xl"
		role="presentation"
	>
		<div
			class="panel w-full max-w-md p-7"
			role="dialog"
			aria-modal="true"
			aria-labelledby="reset-title"
		>
			<div class="flex items-start justify-between gap-4">
				<div
					class="grid size-11 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300"
				>
					<Trash2 size={19} />
				</div>
				<button
					type="button"
					class="grid size-8 place-items-center rounded-full border border-line text-fog transition-colors hover:text-white"
					aria-label="Close reset dialog"
					onclick={() => (confirmingReset = false)}
				>
					<X size={15} />
				</button>
			</div>
			<h2
				id="reset-title"
				class="mt-6 font-display text-2xl font-semibold tracking-[-0.04em] text-white"
			>
				Reset all progress?
			</h2>
			<p class="mt-3 text-sm leading-6 text-fog">
				This removes all {progress.totalAttempts} logged {progress.totalAttempts === 1
					? 'run'
					: 'runs'} from this browser. It cannot be undone.
			</p>
			<div class="mt-7 flex flex-col gap-2.5 sm:flex-row-reverse">
				<button type="button" class="btn btn-danger flex-1" onclick={resetProgress}
					>Yes, reset everything</button
				>
				<button
					type="button"
					class="btn btn-secondary flex-1"
					onclick={() => (confirmingReset = false)}>Keep my data</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		min-height: 100vh;
		background:
			radial-gradient(ellipse 70% 38% at 50% 0%, rgba(161, 0, 255, 0.075), transparent 72%),
			var(--color-void);
	}

	.dashboard-glow {
		position: absolute;
		top: -14rem;
		right: -8rem;
		width: 36rem;
		height: 36rem;
		border-radius: 50%;
		background: rgba(91, 33, 182, 0.14);
		filter: blur(110px);
		pointer-events: none;
	}

	.readiness-panel {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.085);
		border-radius: 1.6rem;
		padding: clamp(1.35rem, 3vw, 2rem);
		background:
			radial-gradient(ellipse 80% 100% at 0% 0%, rgba(161, 0, 255, 0.14), transparent 60%),
			linear-gradient(150deg, rgba(255, 255, 255, 0.035), transparent 45%), var(--color-surface);
		box-shadow: 0 28px 90px rgba(0, 0, 0, 0.28);
	}

	.stat-tile {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.15rem;
		padding: 1.1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.stat-icon {
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.075);
		border-radius: 0.6rem;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-violet-soft);
	}

	.recommend-card {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(199, 125, 255, 0.17);
		border-radius: 1.5rem;
		padding: 1.4rem;
		background:
			radial-gradient(ellipse 90% 80% at 100% 0%, rgba(161, 0, 255, 0.14), transparent 60%),
			var(--color-panel);
	}
</style>
