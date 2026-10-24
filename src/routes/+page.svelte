<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { ArrowRight, ArrowUpRight, Check, Clock3, Gauge, ShieldCheck } from '@lucide/svelte';
	import Aurora from '#lib/components/svelte-bits/Aurora.svelte';
	import ShinyText from '#lib/components/svelte-bits/ShinyText.svelte';
	import DrillCard from '#lib/components/DrillCard.svelte';
	import GameIcon from '#lib/components/GameIcon.svelte';
	import ProgressRing from '#lib/components/ProgressRing.svelte';
	import { GAMES, SKILLS } from '#lib/data/games';
	import { revealOnScroll } from '#lib/motion/reveal';
	import { progress } from '#lib/stores/progress.svelte';

	let root: HTMLElement;

	const previewScores = $derived([
		{ ...GAMES[0], value: progress.bestFor('matrix-flow') ?? 0 },
		{ ...GAMES[1], value: progress.bestFor('balloon-math') ?? 0 },
		{ ...GAMES[2], value: progress.bestFor('hidden-maze') ?? 0 }
	]);

	onMount(() => {
		progress.load();
		return revealOnScroll(root);
	});
</script>

<svelte:head>
	<title>Cognitive Lab — Train for high-pressure assessments</title>
	<meta
		name="description"
		content="Three focused cognitive drills for logic, numerical speed, and spatial memory. Practice under pressure. Track your readiness locally. No signup."
	/>
</svelte:head>

<div class="home" bind:this={root}>
	<section class="hero noise">
		<div class="hero-aurora" aria-hidden="true">
			<Aurora
				colorStops={['#a100ff', '#5b21b6', '#08060d']}
				amplitude={1.15}
				blend={0.72}
				speed={0.32}
			/>
		</div>
		<div class="hero-grid" aria-hidden="true"></div>
		<div class="hero-glow" aria-hidden="true"></div>

		<div class="lab-container-wide relative z-10">
			<div class="hero-layout">
				<div class="hero-copy">
					<div class="eyebrow" data-reveal>Cognitive performance lab</div>
					<h1 class="hero-title" data-reveal>
						Think sharper.<br />
						Move <span class="text-gradient">faster.</span>
					</h1>
					<p class="hero-lede" data-reveal>
						Three precision drills for the thinking skills high-pressure assessments test: logical
						flow, numerical speed, and spatial memory. Built to feel like the real thing — without
						the noise.
					</p>

					<div class="mt-8 flex flex-col gap-3 sm:flex-row" data-reveal>
						<a href={resolve('/dashboard')} class="btn btn-primary">
							Start a free session
							<ArrowRight size={17} />
						</a>
						<a href="#drills" class="btn btn-secondary">
							Explore the drills
							<ArrowUpRight size={16} />
						</a>
					</div>

					<div class="hero-meta" data-reveal>
						<span><Clock3 size={13} /> 5–12 minute sessions</span>
						<span><ShieldCheck size={13} /> No sign-up or tracking</span>
						<span><Gauge size={13} /> Instant scoring</span>
					</div>
				</div>

				<div class="preview-wrap" data-reveal>
					<div class="preview-orbit preview-orbit-a" aria-hidden="true"></div>
					<div class="preview-orbit preview-orbit-b" aria-hidden="true"></div>

					<div class="preview-card">
						<div class="preview-top">
							<div class="flex items-center gap-1.5">
								<span class="size-1.5 rounded-full bg-white/20"></span>
								<span class="size-1.5 rounded-full bg-white/12"></span>
								<span class="size-1.5 rounded-full bg-white/8"></span>
							</div>
							<span class="text-[0.58rem] font-bold tracking-[0.2em] text-fog uppercase"
								>Session preview</span
							>
							<span class="preview-live">Live</span>
						</div>

						<div class="preview-body">
							<div class="flex items-start justify-between gap-5">
								<div>
									<div class="text-[0.58rem] font-bold tracking-[0.18em] text-fog uppercase">
										Readiness
									</div>
									<div
										class="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-white"
									>
										{progress.readinessLabel}
									</div>
									<p class="mt-2 max-w-[18ch] text-[0.68rem] leading-5 text-fog">
										{progress.playedCount === 0
											? 'Log a drill to establish your baseline.'
											: `${progress.playedCount} of 3 drills calibrated.`}
									</p>
								</div>
								<ProgressRing value={progress.readiness} size={112} stroke={6} label="Index" />
							</div>

							<div class="preview-divider"></div>

							<div class="space-y-3.5">
								{#each previewScores as game (game.slug)}
									<div>
										<div class="flex items-center justify-between gap-3">
											<div class="flex items-center gap-2.5">
												<span
													class="preview-icon"
													style={`--accent: ${game.accent}; --soft: ${game.softAccent}`}
												>
													<GameIcon icon={game.icon} class="size-3.5" />
												</span>
												<span class="text-xs font-medium text-mist">{game.name}</span>
											</div>
											<span class="font-display text-[0.7rem] text-white tabular-nums">
												{game.value > 0 ? game.value : '—'}
											</span>
										</div>
										<div class="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.055]">
											<div
												class="h-full rounded-full transition-[width] duration-700"
												style:width={`${game.value}%`}
												style:background={`linear-gradient(90deg, ${game.softAccent}, ${game.accent})`}
											></div>
										</div>
									</div>
								{/each}
							</div>

							<a href={resolve('/dashboard')} class="preview-cta">
								<span>Open training floor</span>
								<ArrowRight size={14} />
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="hero-foot">
			<div class="lab-container-wide">
				<div class="hero-foot-inner">
					<span>Logic</span>
					<span class="dot"></span>
					<span>Numerical fluency</span>
					<span class="dot"></span>
					<span>Spatial memory</span>
					<span class="dot"></span>
					<span>Time pressure</span>
					<span class="dot"></span>
					<span>Working memory</span>
				</div>
			</div>
		</div>
	</section>

	<section class="relative py-20 sm:py-28">
		<div class="lab-container">
			<div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
				<div data-reveal>
					<div class="eyebrow">Built for the real thing</div>
					<h2
						class="mt-5 font-display text-[clamp(2.3rem,5vw,4.6rem)] leading-[0.96] font-semibold tracking-[-0.06em] text-white"
					>
						Practice the pressure,<br />
						not just the puzzle.
					</h2>
				</div>
				<div class="flex flex-col justify-end" data-reveal>
					<p class="max-w-xl text-base leading-8 text-mist">
						Most practice tools stop at the puzzle. Cognitive Lab recreates the conditions that
						matter: a visible clock, irreversible choices, and a score that tells you exactly where
						attention dropped.
					</p>
					<div class="mt-8 grid grid-cols-3 gap-3">
						<div class="metric">
							<div class="font-display text-2xl font-semibold text-white">3</div>
							<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">
								Focused drills
							</div>
						</div>
						<div class="metric">
							<div class="font-display text-2xl font-semibold text-white">
								90<span class="text-sm">s</span>
							</div>
							<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">
								Sprint pressure
							</div>
						</div>
						<div class="metric">
							<div class="font-display text-2xl font-semibold text-white">100</div>
							<div class="mt-1 text-[0.62rem] tracking-[0.14em] text-fog uppercase">
								Point scale
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-14 grid gap-4 md:grid-cols-3" data-reveal>
				{#each SKILLS as skill, index (skill.key)}
					<div class="skill-card">
						<div class="flex items-start justify-between gap-4">
							<span class="skill-index">0{index + 1}</span>
							<span class="tag">{GAMES.find((game) => game.skill === skill.key)?.duration}</span>
						</div>
						<h3 class="mt-8 font-display text-xl font-semibold tracking-[-0.035em] text-white">
							{skill.label}
						</h3>
						<p class="mt-3 text-sm leading-6 text-fog">{skill.description}</p>
						<div class="mt-7 flex items-center gap-2 text-[0.68rem] font-medium text-mist">
							<span class="size-1 rounded-full bg-violet-soft"></span>
							Weighted into readiness
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section id="drills" class="relative py-20 sm:py-24">
		<div class="lab-container">
			<div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-end" data-reveal>
				<div>
					<div class="eyebrow">The training floor</div>
					<h2
						class="mt-5 max-w-2xl font-display text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.94] font-semibold tracking-[-0.065em] text-white"
					>
						Three drills.<br />
						One sharper mind.
					</h2>
				</div>
				<a href={resolve('/dashboard')} class="btn btn-secondary shrink-0">
					View your training
					<ArrowUpRight size={16} />
				</a>
			</div>

			<div class="mt-12 grid gap-4 lg:grid-cols-3">
				{#each GAMES as game (game.slug)}
					<div data-reveal>
						<DrillCard
							{game}
							best={progress.bestFor(game.slug)}
							attempts={progress.statsFor(game.slug).attempts}
						/>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative overflow-hidden py-20 sm:py-28">
		<div class="method-glow" aria-hidden="true"></div>
		<div class="lab-container relative z-10">
			<div class="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
				<div data-reveal>
					<div class="eyebrow">The method</div>
					<h2
						class="mt-5 font-display text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.94] font-semibold tracking-[-0.065em] text-white"
					>
						Measure.<br />
						Train.<br />
						<span class="text-gradient">Repeat.</span>
					</h2>
					<p class="mt-6 max-w-md text-sm leading-7 text-fog">
						Readiness is a weighted blend of your best scores across all three drills. No vanity
						metrics. Just a clear signal of where to focus next.
					</p>
					<a
						href={resolve('/about')}
						class="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white"
					>
						Read the method
						<ArrowRight size={15} />
					</a>
				</div>

				<div class="space-y-3" data-reveal>
					{#each [{ step: '01', title: 'Log a baseline', copy: 'Every drill starts with a clean run. Your first score establishes the reference point, not a ceiling.', time: '2 min' }, { step: '02', title: 'Attack the weak signal', copy: 'The dashboard recommends the drill that will move your readiness score the most.', time: '5 min' }, { step: '03', title: 'Review the pattern', copy: 'Accuracy, pace, resets, wrong checks — each run leaves a trail you can act on.', time: '1 min' }] as item (item.step)}
						<div class="method-row">
							<div class="method-step">{item.step}</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<h3 class="font-display text-lg font-semibold tracking-[-0.03em] text-white">
										{item.title}
									</h3>
									<span class="tag">{item.time}</span>
								</div>
								<p class="mt-2 text-sm leading-6 text-fog">{item.copy}</p>
							</div>
							<ArrowUpRight size={16} class="mt-1 shrink-0 text-fog" />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="pt-10 pb-6 sm:pb-10">
		<div class="lab-container">
			<div class="cta-panel noise" data-reveal>
				<div class="cta-aurora" aria-hidden="true">
					<Aurora
						colorStops={['#a100ff', '#7c3aed', '#08060d']}
						amplitude={0.85}
						blend={0.58}
						speed={0.24}
					/>
				</div>
				<div class="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
					<div>
						<div class="eyebrow">No account. No excuses.</div>
						<h2
							class="mt-5 max-w-2xl font-display text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.91] font-semibold tracking-[-0.07em] text-white"
						>
							Your next edge<br />
							starts with one run.
						</h2>
					</div>
					<div class="lg:pb-3">
						<p class="max-w-sm text-sm leading-7 text-mist">
							<ShinyText
								text="Three drills. A visible clock. A score you can trust."
								color="#bdb5ce"
								shineColor="#ffffff"
								speed={4.5}
								spread={110}
								class="font-medium"
							/>
						</p>
						<div class="mt-6 flex flex-col gap-3 sm:flex-row">
							<a href={resolve('/dashboard')} class="btn btn-primary">
								Start training
								<ArrowRight size={16} />
							</a>
							<a href={resolve('/about')} class="btn btn-secondary">How it works</a>
						</div>
						<div class="mt-5 flex flex-wrap gap-4 text-[0.65rem] text-fog">
							<span class="inline-flex items-center gap-1.5"><Check size={12} /> Free forever</span>
							<span class="inline-flex items-center gap-1.5"><Check size={12} /> No sign-up</span>
							<span class="inline-flex items-center gap-1.5"
								><Check size={12} /> Private by default</span
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.home {
		overflow: clip;
	}

	.hero {
		position: relative;
		min-height: min(940px, 100svh);
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		border-bottom: 1px solid rgba(255, 255, 255, 0.055);
		padding-top: calc(var(--nav-height) + 2rem);
	}

	.hero-aurora {
		position: absolute;
		inset: -20% -10% auto;
		height: 90%;
		opacity: 0.58;
		filter: blur(18px);
	}

	.hero-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
		background-size: 64px 64px;
		mask-image: radial-gradient(ellipse 80% 60% at 50% 24%, black, transparent 74%);
		pointer-events: none;
	}

	.hero-glow {
		position: absolute;
		top: 8%;
		left: 50%;
		width: min(86vw, 900px);
		height: 420px;
		border-radius: 50%;
		background: rgba(161, 0, 255, 0.18);
		filter: blur(130px);
		transform: translateX(-50%);
		pointer-events: none;
	}

	.hero-layout {
		display: grid;
		align-items: center;
		gap: 3.5rem;
		padding-block: 3rem 5rem;
	}

	.hero-title {
		margin-top: 1.25rem;
		color: white;
		font-family: var(--font-display);
		font-size: clamp(3.4rem, 9vw, 7.8rem);
		font-weight: 600;
		line-height: 0.87;
		letter-spacing: -0.075em;
	}

	.hero-lede {
		margin-top: 1.65rem;
		max-width: 34rem;
		color: var(--color-mist);
		font-size: clamp(0.92rem, 1.4vw, 1.03rem);
		line-height: 1.8;
	}

	.hero-meta {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
		color: var(--color-fog);
		font-size: 0.68rem;
		font-weight: 500;
	}

	.hero-meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.preview-wrap {
		position: relative;
		width: 100%;
		max-width: 29rem;
		margin-inline: auto;
	}

	.preview-orbit {
		position: absolute;
		border: 1px solid rgba(199, 125, 255, 0.13);
		border-radius: 50%;
		pointer-events: none;
	}

	.preview-orbit-a {
		inset: -3rem -2.5rem;
	}

	.preview-orbit-b {
		inset: -6rem -5.5rem;
		border-color: rgba(255, 255, 255, 0.045);
	}

	.preview-card {
		position: relative;
		z-index: 1;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.75rem;
		background:
			linear-gradient(145deg, rgba(255, 255, 255, 0.055), transparent 38%), rgba(14, 11, 20, 0.9);
		box-shadow:
			0 40px 120px rgba(0, 0, 0, 0.55),
			0 0 0 1px rgba(161, 0, 255, 0.08);
		backdrop-filter: blur(18px);
		transform: rotate(1.2deg);
	}

	.preview-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.065);
		padding: 0.9rem 1.1rem;
		background: rgba(255, 255, 255, 0.018);
	}

	.preview-live {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid rgba(183, 247, 216, 0.16);
		border-radius: 999px;
		padding: 0.18rem 0.48rem;
		background: rgba(183, 247, 216, 0.06);
		color: var(--color-mint);
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.preview-live::before {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 7px currentColor;
		content: '';
	}

	.preview-body {
		padding: 1.35rem;
	}

	.preview-divider {
		height: 1px;
		margin-block: 1.3rem;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
	}

	.preview-icon {
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		border-radius: 0.5rem;
		background: var(--soft);
		color: var(--accent);
	}

	.preview-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.35rem;
		border: 1px solid rgba(199, 125, 255, 0.23);
		border-radius: 0.9rem;
		padding: 0.8rem 0.95rem;
		background: rgba(161, 0, 255, 0.1);
		color: white;
		font-size: 0.72rem;
		font-weight: 600;
		transition:
			background-color 200ms ease,
			border-color 200ms ease;
	}

	.preview-cta:hover {
		border-color: rgba(199, 125, 255, 0.42);
		background: rgba(161, 0, 255, 0.17);
	}

	.hero-foot {
		position: relative;
		z-index: 10;
		border-top: 1px solid rgba(255, 255, 255, 0.055);
	}

	.hero-foot-inner {
		display: flex;
		align-items: center;
		gap: 1.2rem;
		overflow: hidden;
		padding-block: 1rem;
		color: var(--color-fog);
		font-size: 0.6rem;
		font-weight: 650;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.hero-foot-inner .dot {
		width: 3px;
		height: 3px;
		flex: none;
		border-radius: 999px;
		background: var(--color-violet);
		box-shadow: 0 0 8px var(--color-violet);
	}

	.metric {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
	}

	.skill-card {
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.35rem;
		padding: 1.4rem;
		background:
			linear-gradient(150deg, rgba(255, 255, 255, 0.03), transparent 40%), rgba(14, 11, 20, 0.62);
		transition: border-color 250ms ease;
	}

	.skill-card:hover {
		border-color: rgba(199, 125, 255, 0.24);
	}

	.skill-index {
		color: var(--color-violet-soft);
		font-family: var(--font-display);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	.method-glow {
		position: absolute;
		top: 20%;
		right: -10%;
		width: 38rem;
		height: 38rem;
		border-radius: 50%;
		background: rgba(91, 33, 182, 0.12);
		filter: blur(120px);
		pointer-events: none;
	}

	.method-row {
		display: flex;
		gap: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1.2rem;
		padding: 1.2rem;
		background: rgba(255, 255, 255, 0.018);
		transition:
			background-color 220ms ease,
			border-color 220ms ease;
	}

	.method-row:hover {
		border-color: rgba(199, 125, 255, 0.22);
		background: rgba(255, 255, 255, 0.032);
	}

	.method-step {
		display: grid;
		width: 2.2rem;
		height: 2.2rem;
		flex: none;
		place-items: center;
		border: 1px solid rgba(199, 125, 255, 0.19);
		border-radius: 0.7rem;
		background: rgba(161, 0, 255, 0.08);
		color: var(--color-violet-soft);
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-weight: 700;
	}

	.cta-panel {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 2rem;
		padding: clamp(1.6rem, 5vw, 4rem);
		background: #0c0912;
	}

	.cta-aurora {
		position: absolute;
		inset: -30% -5% -50% 35%;
		opacity: 0.48;
		filter: blur(20px);
	}

	@media (min-width: 900px) {
		.hero-layout {
			grid-template-columns: minmax(0, 1.08fr) minmax(22rem, 0.92fr);
			gap: 2rem;
		}

		.preview-wrap {
			margin-right: 1.5rem;
		}
	}

	@media (max-width: 640px) {
		.hero {
			min-height: auto;
			padding-top: calc(var(--nav-height) + 1.5rem);
		}

		.hero-layout {
			padding-block: 2.25rem 3.5rem;
		}

		.hero-title {
			letter-spacing: -0.065em;
		}

		.preview-card {
			transform: none;
		}
	}
</style>
