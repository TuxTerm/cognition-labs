<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft, ArrowRight, Clock3, Keyboard, Sparkles, Trophy } from '@lucide/svelte';
	import GameIcon from '#lib/components/GameIcon.svelte';
	import type { GameMeta } from '#lib/data/games';

	type Props = {
		meta: GameMeta;
		best: number | null;
		attempts?: number;
		onStart: () => void;
	};
	let { meta, best, attempts = 0, onStart }: Props = $props();
</script>

<div class="game-intro" style={`--accent: ${meta.accent}; --accent-soft: ${meta.softAccent}`}>
	<div class="lab-container pt-10 pb-10 sm:pt-32">
		<a
			href={resolve('/dashboard')}
			class="mb-8 inline-flex items-center gap-2 text-xs font-medium text-fog transition-colors hover:text-white"
		>
			<ArrowLeft size={14} />
			Back to training floor
		</a>

		<div class="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
			<div>
				<div class="flex items-center gap-3">
					<span class="intro-icon">
						<GameIcon icon={meta.icon} class="size-7" />
					</span>
					<div>
						<div class="text-[0.6rem] font-bold tracking-[0.2em] text-fog uppercase">
							Drill {meta.number} · {meta.tag}
						</div>
						<div class="mt-1 text-[0.68rem] text-mist">{meta.duration}</div>
					</div>
				</div>

				<h1
					class="mt-7 font-display text-[clamp(3rem,8vw,6.8rem)] leading-[0.88] font-semibold tracking-[-0.07em] text-white"
				>
					{meta.name}
				</h1>
				<p
					class="mt-5 max-w-xl font-display text-xl leading-snug font-medium tracking-[-0.025em] text-mist sm:text-2xl"
				>
					{meta.tagline}
				</p>
				<p class="mt-4 max-w-xl text-sm leading-7 text-fog">{meta.description}</p>

				<div class="mt-9 flex flex-wrap items-center gap-3">
					<button type="button" class="btn btn-primary min-w-[190px]" onclick={onStart}>
						Start drill
						<ArrowRight size={17} />
					</button>
					{#if best !== null}
						<div
							class="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.025] px-4 py-2.5 text-xs text-mist"
						>
							<Trophy size={14} class="text-signal" />
							Personal best <strong class="font-semibold text-white">{best}</strong>
						</div>
					{/if}
				</div>

				<div class="mt-12 grid gap-3 sm:grid-cols-2">
					{#each meta.rules as rule, index (rule)}
						<div class="rule-card" data-reveal>
							<span class="rule-number">{String(index + 1).padStart(2, '0')}</span>
							<p class="text-[0.8rem] leading-6 text-mist">{rule}</p>
						</div>
					{/each}
				</div>
			</div>

			<aside class="lg:sticky lg:top-28 lg:self-start">
				<div class="briefing-card">
					<div class="flex items-center justify-between">
						<span class="text-[0.6rem] font-bold tracking-[0.2em] text-fog uppercase"
							>Run briefing</span
						>
						<span class="live-dot">Ready</span>
					</div>

					<div class="mt-6 space-y-5">
						<div class="flex items-start gap-3">
							<Clock3 size={16} class="mt-0.5 shrink-0 text-mist" />
							<div>
								<div class="text-[0.62rem] font-semibold tracking-[0.14em] text-fog uppercase">
									Duration
								</div>
								<div class="mt-1 text-sm text-white">{meta.duration}</div>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Keyboard size={16} class="mt-0.5 shrink-0 text-mist" />
							<div>
								<div class="text-[0.62rem] font-semibold tracking-[0.14em] text-fog uppercase">
									Controls
								</div>
								<div class="mt-2 flex flex-wrap gap-1.5">
									{#each meta.controls as control (control)}
										<span class="control-chip">{control}</span>
									{/each}
								</div>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Sparkles size={16} class="mt-0.5 shrink-0 text-mist" />
							<div>
								<div class="text-[0.62rem] font-semibold tracking-[0.14em] text-fog uppercase">
									Measures
								</div>
								<div class="mt-1 text-sm text-white">{meta.skillLabel}</div>
							</div>
						</div>
					</div>

					<div class="mt-7 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
						<div class="flex items-center justify-between text-xs">
							<span class="text-fog">Attempts logged</span>
							<span class="font-display text-white">{attempts}</span>
						</div>
						<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
							<div
								class="h-full rounded-full"
								style:width={`${best ?? 0}%`}
								style:background={meta.accent}
							></div>
						</div>
						<p class="mt-3 text-[0.68rem] leading-5 text-fog">
							Every run is stored locally. Your best score feeds the readiness gauge on the
							dashboard.
						</p>
					</div>

					<p class="mt-5 text-[0.65rem] leading-5 text-fog">
						This is an independent practice simulation inspired by publicly described assessment
						formats. It is not an official Accenture test.
					</p>
				</div>
			</aside>
		</div>
	</div>
</div>

<style>
	.game-intro {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background:
			radial-gradient(ellipse 60% 40% at 24% 12%, var(--accent-soft), transparent 70%),
			var(--color-void);
	}

	.game-intro::before {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.028) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.028) 1px, transparent 1px);
		background-size: 56px 56px;
		mask-image: radial-gradient(ellipse at 30% 10%, black, transparent 64%);
		content: '';
		pointer-events: none;
	}

	.intro-icon {
		display: grid;
		width: 3.2rem;
		height: 3.2rem;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
		border-radius: 1rem;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.rule-card {
		display: flex;
		gap: 0.85rem;
		border: 1px solid rgba(255, 255, 255, 0.065);
		border-radius: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.018);
	}

	.rule-number {
		color: color-mix(in srgb, var(--accent) 82%, white);
		font-family: var(--font-display);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.briefing-card {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.6rem;
		padding: 1.4rem;
		background:
			linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 42%), rgba(14, 11, 20, 0.82);
		box-shadow: 0 26px 80px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(18px);
	}

	.live-dot {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid rgba(183, 247, 216, 0.18);
		border-radius: 999px;
		padding: 0.22rem 0.55rem;
		background: rgba(183, 247, 216, 0.07);
		color: var(--color-mint);
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.live-dot::before {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: currentColor;
		content: '';
		box-shadow: 0 0 8px currentColor;
	}

	.control-chip {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		padding: 0.24rem 0.48rem;
		background: rgba(255, 255, 255, 0.035);
		color: var(--color-mist);
		font-size: 0.62rem;
	}
</style>
