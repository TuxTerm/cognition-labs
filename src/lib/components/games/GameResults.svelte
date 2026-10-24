<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { ArrowRight, Home, RotateCcw, Trophy } from '@lucide/svelte';
	import { gsap } from 'gsap';
	import ProgressRing from '#lib/components/ProgressRing.svelte';
	import { prefersReducedMotion } from '#lib/motion/reveal';
	import type { GameMeta } from '#lib/data/games';
	import type { GameResult } from '#lib/games/shared/types';

	type Stat = { label: string; value: string };

	type Props = {
		meta: GameMeta;
		result: GameResult;
		isBest: boolean;
		previousBest: number | null;
		headline: string;
		summary: string;
		stats: Stat[];
		onRetry: () => void;
	};
	let { meta, result, isBest, previousBest, headline, summary, stats, onRetry }: Props = $props();
	let root: HTMLDivElement;

	onMount(() => {
		if (prefersReducedMotion()) return;
		const context = gsap.context(() => {
			gsap.from('.result-stagger', {
				y: 22,
				autoAlpha: 0,
				duration: 0.75,
				stagger: 0.075,
				ease: 'power3.out',
				delay: 0.08
			});
		}, root);
		return () => context.revert();
	});
</script>

<div
	class="results-shell"
	bind:this={root}
	style={`--accent: ${meta.accent}; --accent-soft: ${meta.softAccent}`}
>
	<div class="lab-container py-28 sm:py-32">
		<div class="mx-auto max-w-4xl">
			<div class="result-stagger flex flex-wrap items-center justify-between gap-4">
				<div class="eyebrow">Run complete · {meta.name}</div>
				{#if isBest}
					<div class="best-badge">
						<Trophy size={14} />
						{previousBest === null ? 'First score logged' : 'New personal best'}
					</div>
				{:else if previousBest !== null}
					<div class="text-xs text-fog">
						Personal best <span class="font-semibold text-white">{previousBest}</span>
					</div>
				{/if}
			</div>

			<div class="mt-8 grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-14">
				<div class="result-stagger relative mx-auto md:mx-0">
					<div class="absolute inset-0 rounded-full bg-violet/15 blur-3xl"></div>
					<ProgressRing value={result.score} size={230} stroke={8} label="Score" />
				</div>

				<div>
					<h1
						class="result-stagger font-display text-[clamp(2.7rem,7vw,5.4rem)] leading-[0.92] font-semibold tracking-[-0.065em] text-white"
					>
						{headline}
					</h1>
					<p class="result-stagger mt-5 max-w-md text-sm leading-7 text-fog">{summary}</p>
					<div class="result-stagger mt-6 flex flex-wrap gap-2">
						<span class="tag">{meta.tag}</span>
						<span class="tag">{result.accuracy}% accuracy</span>
						<span class="tag">{Math.round(result.durationMs / 1000)}s logged</span>
					</div>
				</div>
			</div>

			<div class="result-stagger mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each stats as stat (stat.label)}
					<div class="stat-card">
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase">
							{stat.label}
						</div>
						<div class="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
							{stat.value}
						</div>
					</div>
				{/each}
			</div>

			<div class="result-stagger mt-8 flex flex-col gap-3 sm:flex-row">
				<button type="button" class="btn btn-primary" onclick={onRetry}>
					<RotateCcw size={16} />
					Run it back
					<ArrowRight size={15} />
				</button>
				<a href={resolve('/dashboard')} class="btn btn-secondary">
					<Home size={15} />
					Back to training floor
				</a>
			</div>

			<p class="result-stagger mt-8 text-[0.66rem] leading-5 text-fog">
				Score is normalized to 100 and weighted into your readiness gauge. Progress is saved locally
				on this device.
			</p>
		</div>
	</div>
</div>

<style>
	.results-shell {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background:
			radial-gradient(ellipse 55% 45% at 22% 12%, var(--accent-soft), transparent 70%),
			var(--color-void);
	}

	.results-shell::before {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
		background-size: 52px 52px;
		mask-image: radial-gradient(ellipse at 28% 16%, black, transparent 70%);
		content: '';
		pointer-events: none;
	}

	.best-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		border-radius: 999px;
		padding: 0.35rem 0.7rem;
		background: var(--accent-soft);
		color: color-mix(in srgb, var(--accent) 65%, white);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.stat-card {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.1rem;
		padding: 1.1rem;
		background: rgba(255, 255, 255, 0.025);
	}
</style>
