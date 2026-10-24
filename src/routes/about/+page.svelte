<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import {
		ArrowRight,
		ArrowUpRight,
		BrainCircuit,
		Check,
		Clock3,
		Gauge,
		LockKeyhole,
		ShieldAlert,
		Sparkles,
		Target,
		Zap
	} from '@lucide/svelte';
	import GameIcon from '#lib/components/GameIcon.svelte';
	import { GAMES, GAME_WEIGHTS } from '#lib/data/games';
	import { revealOnScroll } from '#lib/motion/reveal';

	let root: HTMLElement;

	onMount(() => revealOnScroll(root));

	const principles = [
		{
			title: 'Speed is part of the skill',
			copy: 'Every drill runs against a visible clock. Accuracy without pace is not the same performance as accuracy under pressure.',
			icon: Clock3
		},
		{
			title: 'One signal per drill',
			copy: 'Each game isolates a distinct cognitive demand. You know whether a weak score came from logic, arithmetic, or spatial memory.',
			icon: Target
		},
		{
			title: 'Scores stay honest',
			copy: 'Readiness uses your best result per drill, weighted by assessment relevance. No streak inflation, no participation points.',
			icon: Gauge
		},
		{
			title: 'Your data is yours',
			copy: 'There is no account, server, or analytics pipeline. Progress is written to localStorage on the device you are using.',
			icon: LockKeyhole
		}
	];

	const faqs = [
		{
			q: 'Is this an official Accenture assessment?',
			a: 'No. Cognitive Lab is an independent practice tool. The formats are inspired by publicly described cognitive assessments, but this site is not affiliated with, endorsed by, or connected to Accenture in any way.'
		},
		{
			q: 'What does “readiness” actually mean?',
			a: 'It is a weighted average of your best normalized score on each drill: logic 40%, numerical speed 30%, and spatial memory 30%. If you have not played all three, the score is marked provisional.'
		},
		{
			q: 'How often should I train?',
			a: 'A short session of two to three runs is enough. The drills reward focused repetition, not marathon play. Give yourself a day between heavy sessions if you feel mentally fatigued.'
		},
		{
			q: 'Does a high score predict job performance?',
			a: 'No. A practice score measures performance on a specific game, on a specific day. It is not a clinical test and should not be used for hiring, diagnosis, or any high-stakes decision.'
		}
	];
</script>

<svelte:head>
	<title>The method — Cognitive Lab</title>
	<meta
		name="description"
		content="How Cognitive Lab designs its logic, numerical, and spatial drills, calculates readiness, and keeps your progress private."
	/>
</svelte:head>

<div class="about" bind:this={root}>
	<section
		class="relative overflow-hidden border-b border-white/[0.055] pt-28 pb-16 sm:pt-36 sm:pb-24"
	>
		<div class="about-grid" aria-hidden="true"></div>
		<div class="about-glow" aria-hidden="true"></div>
		<div class="lab-container relative z-10">
			<div class="eyebrow">The method</div>
			<h1
				class="mt-6 max-w-5xl font-display text-[clamp(3rem,8vw,7.2rem)] leading-[0.87] font-semibold tracking-[-0.075em] text-white"
			>
				Built like an assessment.<br />
				<span class="text-gradient">Designed to train.</span>
			</h1>
			<div class="mt-9 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
				<p
					class="max-w-lg font-display text-xl leading-snug font-medium tracking-[-0.025em] text-mist sm:text-2xl"
				>
					Cognitive Lab strips the assessment experience down to the parts you can actually
					practice.
				</p>
				<div class="max-w-xl space-y-4 text-sm leading-7 text-fog">
					<p>
						High-pressure assessments rarely test raw intelligence in isolation. They test whether
						you can recognize a pattern, hold a rule in working memory, and act accurately while a
						clock is running.
					</p>
					<p>
						The three drills here target those demands directly. Each one is deliberately narrow so
						that a score means something specific — and so that improvement has somewhere to show
						up.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="py-20 sm:py-28">
		<div class="lab-container">
			<div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end" data-reveal>
				<div>
					<div class="eyebrow">The drills</div>
					<h2
						class="mt-5 max-w-2xl font-display text-[clamp(2.3rem,5vw,4.4rem)] leading-[0.94] font-semibold tracking-[-0.06em] text-white"
					>
						Three narrow tests.<br />
						Three distinct signals.
					</h2>
				</div>
				<a href={resolve('/dashboard')} class="btn btn-secondary shrink-0">
					Open training floor
					<ArrowUpRight size={16} />
				</a>
			</div>

			<div class="mt-12 space-y-3">
				{#each GAMES as game, index (game.slug)}
					<div
						class="drill-row"
						data-reveal
						style={`--accent: ${game.accent}; --soft: ${game.softAccent}`}
					>
						<div class="drill-number">0{index + 1}</div>
						<div class="drill-icon">
							<GameIcon icon={game.icon} class="size-5" />
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="font-display text-xl font-semibold tracking-[-0.035em] text-white">
									{game.name}
								</h3>
								<span class="tag">{game.tag}</span>
							</div>
							<p class="mt-2 max-w-2xl text-sm leading-6 text-fog">{game.description}</p>
						</div>
						<div class="hidden w-36 shrink-0 lg:block">
							<div class="text-[0.58rem] font-bold tracking-[0.15em] text-fog uppercase">
								Readiness weight
							</div>
							<div class="mt-2 flex items-center gap-2">
								<div class="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
									<div
										class="h-full rounded-full"
										style:width={`${GAME_WEIGHTS[game.slug] * 100}%`}
										style:background={game.accent}
									></div>
								</div>
								<span class="font-display text-xs text-white"
									>{Math.round(GAME_WEIGHTS[game.slug] * 100)}%</span
								>
							</div>
						</div>
						<a
							href={resolve('/games/[slug]', { slug: game.slug })}
							class="drill-open"
							aria-label={`Open ${game.name}`}
						>
							<ArrowUpRight size={17} />
						</a>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative overflow-hidden py-20 sm:py-24">
		<div class="principle-glow" aria-hidden="true"></div>
		<div class="lab-container relative z-10">
			<div class="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
				<div data-reveal>
					<div class="eyebrow">Design principles</div>
					<h2
						class="mt-5 font-display text-[clamp(2.3rem,5vw,4.4rem)] leading-[0.94] font-semibold tracking-[-0.06em] text-white"
					>
						Less theatre.<br />
						More signal.
					</h2>
					<p class="mt-6 max-w-sm text-sm leading-7 text-fog">
						The interface is quiet on purpose. A calm surface makes the timer, the decision, and the
						result easier to read.
					</p>
				</div>
				<div class="grid gap-3 sm:grid-cols-2" data-reveal>
					{#each principles as principle (principle.title)}
						<div class="principle-card">
							<div class="principle-icon">
								<principle.icon size={17} />
							</div>
							<h3 class="mt-6 font-display text-lg font-semibold tracking-[-0.03em] text-white">
								{principle.title}
							</h3>
							<p class="mt-2.5 text-xs leading-6 text-fog">{principle.copy}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="py-20 sm:py-24">
		<div class="lab-container">
			<div class="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
				<div data-reveal>
					<div class="eyebrow">The formula</div>
					<h2
						class="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-white"
					>
						One number,<br />
						three inputs.
					</h2>
					<p class="mt-6 max-w-sm text-sm leading-7 text-fog">
						Readiness is intentionally simple. Your best score in each drill is weighted by how
						directly that skill appears in the practice format.
					</p>
					<div
						class="mt-7 inline-flex items-center gap-2 rounded-xl border border-line bg-white/[0.025] px-4 py-3 text-xs text-mist"
					>
						<BrainCircuit size={15} class="text-violet-soft" />
						Logic 40% · Numerical 30% · Spatial 30%
					</div>
				</div>

				<div class="formula-panel" data-reveal>
					<div class="flex items-center justify-between border-b border-white/[0.07] pb-4">
						<span class="text-[0.6rem] font-bold tracking-[0.16em] text-fog uppercase"
							>Readiness composition</span
						>
						<span class="tag">Best score per drill</span>
					</div>
					<div class="mt-6 space-y-5">
						{#each GAMES as game (game.slug)}
							<div>
								<div class="flex items-center justify-between gap-4">
									<div class="flex items-center gap-2.5">
										<span
											class="grid size-7 place-items-center rounded-lg"
											style={`background: ${game.softAccent}; color: ${game.accent};`}
										>
											<GameIcon icon={game.icon} class="size-3.5" />
										</span>
										<span class="text-xs text-mist">{game.name}</span>
									</div>
									<span class="font-display text-xs text-white"
										>{Math.round(GAME_WEIGHTS[game.slug] * 100)}%</span
									>
								</div>
								<div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
									<div
										class="h-full rounded-full"
										style:width={`${GAME_WEIGHTS[game.slug] * 100}%`}
										style:background={`linear-gradient(90deg, ${game.softAccent}, ${game.accent})`}
									></div>
								</div>
							</div>
						{/each}
					</div>
					<div
						class="mt-7 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4"
					>
						<Sparkles size={16} class="mt-0.5 shrink-0 text-violet-soft" />
						<p class="text-[0.68rem] leading-5 text-fog">
							Until all three drills are completed, the dashboard marks your readiness as
							provisional and recommends an unplayed signal.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="py-20 sm:py-24">
		<div class="lab-container">
			<div class="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
				<div data-reveal>
					<div class="eyebrow">Questions</div>
					<h2
						class="mt-5 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-white"
					>
						The honest<br />
						answers.
					</h2>
				</div>
				<div class="space-y-2" data-reveal>
					{#each faqs as faq (faq.q)}
						<details class="faq">
							<summary>
								<span>{faq.q}</span>
								<span class="faq-mark">+</span>
							</summary>
							<p>{faq.a}</p>
						</details>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="pt-8 pb-8">
		<div class="lab-container">
			<div class="disclaimer-card" data-reveal>
				<div class="flex items-start gap-4">
					<div
						class="grid size-11 shrink-0 place-items-center rounded-2xl border border-signal/20 bg-signal/10 text-signal"
					>
						<ShieldAlert size={19} />
					</div>
					<div>
						<div class="text-[0.6rem] font-bold tracking-[0.16em] text-signal uppercase">
							Important disclaimer
						</div>
						<h2 class="mt-2 font-display text-xl font-semibold tracking-[-0.03em] text-white">
							Independent practice tool. Not affiliated with Accenture.
						</h2>
						<p class="mt-3 max-w-3xl text-xs leading-6 text-fog">
							Cognitive Lab is an independent project. The game formats are inspired by publicly
							described cognitive assessment exercises, but all code, content, and scoring are
							original. This site does not reproduce any proprietary assessment, is not endorsed by
							Accenture, and should not be used as a substitute for an official assessment, clinical
							evaluation, or hiring decision.
						</p>
						<div class="mt-4 flex flex-wrap gap-4 text-[0.65rem] text-mist">
							<span class="inline-flex items-center gap-1.5"
								><Check size={12} class="text-mint" /> Original implementation</span
							>
							<span class="inline-flex items-center gap-1.5"
								><Check size={12} class="text-mint" /> No proprietary content</span
							>
							<span class="inline-flex items-center gap-1.5"
								><Check size={12} class="text-mint" /> Local progress only</span
							>
						</div>
					</div>
				</div>
			</div>

			<div class="cta-strip mt-4">
				<div>
					<div
						class="flex items-center gap-2 text-[0.62rem] font-bold tracking-[0.15em] text-violet-soft uppercase"
					>
						<Zap size={12} fill="currentColor" />
						Ready when you are
					</div>
					<h2 class="mt-3 font-display text-2xl font-semibold tracking-[-0.045em] text-white">
						Put the method to work.
					</h2>
				</div>
				<a href={resolve('/dashboard')} class="btn btn-primary">
					Start training
					<ArrowRight size={15} />
				</a>
			</div>
		</div>
	</section>
</div>

<style>
	.about {
		overflow: clip;
	}

	.about-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.032) 1px, transparent 1px);
		background-size: 60px 60px;
		mask-image: radial-gradient(ellipse 70% 65% at 50% 0%, black, transparent 76%);
		pointer-events: none;
	}

	.about-glow {
		position: absolute;
		top: -16rem;
		left: 20%;
		width: 46rem;
		height: 40rem;
		border-radius: 50%;
		background: rgba(161, 0, 255, 0.12);
		filter: blur(140px);
		pointer-events: none;
	}

	.drill-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.15rem;
		background: rgba(255, 255, 255, 0.018);
		transition:
			border-color 220ms ease,
			background-color 220ms ease;
	}

	.drill-row:hover {
		border-color: color-mix(in srgb, var(--accent) 26%, transparent);
		background: rgba(255, 255, 255, 0.03);
	}

	.drill-number {
		display: none;
		color: var(--color-fog);
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.drill-icon {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		flex: none;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		border-radius: 0.9rem;
		background: var(--soft);
		color: var(--accent);
	}

	.drill-open {
		display: grid;
		width: 2.4rem;
		height: 2.4rem;
		flex: none;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		color: var(--color-mist);
		transition:
			background-color 180ms ease,
			color 180ms ease,
			transform 180ms ease;
	}

	.drill-row:hover .drill-open {
		background: var(--accent);
		color: #08060d;
		transform: rotate(4deg);
	}

	.principle-glow {
		position: absolute;
		top: 15%;
		left: -15%;
		width: 34rem;
		height: 34rem;
		border-radius: 50%;
		background: rgba(91, 33, 182, 0.11);
		filter: blur(110px);
		pointer-events: none;
	}

	.principle-card {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.25rem;
		background:
			linear-gradient(150deg, rgba(255, 255, 255, 0.028), transparent 42%), rgba(14, 11, 20, 0.58);
	}

	.principle-icon {
		display: grid;
		width: 2.3rem;
		height: 2.3rem;
		place-items: center;
		border: 1px solid rgba(199, 125, 255, 0.18);
		border-radius: 0.75rem;
		background: rgba(161, 0, 255, 0.07);
		color: var(--color-violet-soft);
	}

	.formula-panel {
		border: 1px solid rgba(255, 255, 255, 0.085);
		border-radius: 1.5rem;
		padding: clamp(1.25rem, 3vw, 1.8rem);
		background:
			radial-gradient(ellipse 70% 60% at 100% 0%, rgba(161, 0, 255, 0.1), transparent 60%),
			var(--color-surface);
	}

	.faq {
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.faq summary {
		display: flex;
		cursor: pointer;
		list-style: none;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding-block: 1.05rem;
		color: var(--color-mist);
		font-size: 0.85rem;
		font-weight: 500;
		transition: color 180ms ease;
	}

	.faq summary::-webkit-details-marker {
		display: none;
	}

	.faq summary:hover,
	.faq[open] summary {
		color: white;
	}

	.faq-mark {
		display: grid;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 999px;
		color: var(--color-fog);
		font-size: 0.9rem;
		font-weight: 400;
		transition:
			transform 200ms ease,
			background-color 200ms ease;
	}

	.faq[open] .faq-mark {
		background: var(--color-violet);
		color: white;
		transform: rotate(45deg);
	}

	.faq p {
		padding-bottom: 1.1rem;
		padding-right: 2.5rem;
		color: var(--color-fog);
		font-size: 0.78rem;
		line-height: 1.8;
	}

	.disclaimer-card {
		border: 1px solid rgba(255, 184, 107, 0.15);
		border-radius: 1.5rem;
		padding: clamp(1.2rem, 3vw, 1.8rem);
		background:
			linear-gradient(120deg, rgba(255, 184, 107, 0.04), transparent 52%), var(--color-surface);
	}

	.cta-strip {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		border: 1px solid rgba(199, 125, 255, 0.16);
		border-radius: 1.5rem;
		padding: clamp(1.2rem, 3vw, 1.8rem);
		background:
			radial-gradient(ellipse 50% 100% at 100% 50%, rgba(161, 0, 255, 0.13), transparent 65%),
			var(--color-panel);
	}

	@media (min-width: 640px) {
		.cta-strip {
			flex-direction: row;
			align-items: center;
		}
	}

	@media (min-width: 768px) {
		.drill-number {
			display: block;
		}
	}
</style>
