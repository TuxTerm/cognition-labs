<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowUpRight, Play } from '@lucide/svelte';
	import GameIcon from '#lib/components/GameIcon.svelte';
	import SpotlightCard from '#lib/components/svelte-bits/SpotlightCard.svelte';
	import type { GameMeta } from '#lib/data/games';

	type Props = {
		game: GameMeta;
		best?: number | null;
		attempts?: number;
	};
	let { game, best = null, attempts = 0 }: Props = $props();
</script>

<a
	href={resolve('/games/[slug]', { slug: game.slug })}
	class="group block h-full rounded-3xl"
	aria-label={`Play ${game.name}`}
	style={`--accent: ${game.accent}; --accent-soft: ${game.softAccent}`}
>
	<SpotlightCard
		class="drill-card h-full !rounded-3xl !border-line !bg-panel !p-0"
		spotlightColor={game.softAccent}
	>
		<div class="relative flex h-full flex-col p-6 sm:p-7">
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-center gap-3">
					<span class="icon-shell">
						<GameIcon icon={game.icon} class="size-6" />
					</span>
					<span class="text-[0.62rem] font-bold tracking-[0.18em] text-fog uppercase"
						>{game.tag}</span
					>
				</div>
				<span class="font-display text-xs text-fog">{game.number}</span>
			</div>

			<div class="mt-8">
				<h3
					class="font-display text-[1.7rem] leading-none font-semibold tracking-[-0.045em] text-white"
				>
					{game.name}
				</h3>
				<p class="mt-2 text-[0.82rem] font-medium text-mist">{game.tagline}</p>
				<p class="mt-4 max-w-[32ch] text-[0.8rem] leading-6 text-fog">{game.description}</p>
			</div>

			<div class="mt-auto pt-8">
				<div class="flex items-end justify-between gap-4 border-t border-white/[0.065] pt-4">
					<div>
						<div class="text-[0.58rem] font-bold tracking-[0.18em] text-fog uppercase">
							Personal best
						</div>
						<div class="mt-1.5 flex items-baseline gap-1">
							{#if best === null}
								<span class="text-sm font-medium text-mist">Unrated</span>
							{:else}
								<span class="font-display text-2xl leading-none font-semibold text-white"
									>{best}</span
								>
								<span class="text-xs text-fog">/ 100</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-3">
						{#if attempts > 0}
							<span class="text-[0.65rem] text-fog"
								>{attempts} {attempts === 1 ? 'run' : 'runs'}</span
							>
						{/if}
						<span class="play-button" aria-hidden="true">
							<Play size={14} fill="currentColor" strokeWidth={0} />
						</span>
					</div>
				</div>
				<div class="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
					<div class="score-line" style:width={`${best ?? 0}%`}></div>
				</div>
				<div class="mt-4 flex items-center justify-between text-[0.68rem] text-fog">
					<span>{game.duration}</span>
					<span
						class="inline-flex items-center gap-1 text-mist transition-colors group-hover:text-white"
					>
						Open drill
						<ArrowUpRight size={13} />
					</span>
				</div>
			</div>
		</div>
	</SpotlightCard>
</a>

<style>
	:global(.drill-card) {
		transition:
			border-color 300ms ease,
			transform 300ms var(--ease-out-expo),
			box-shadow 300ms ease;
	}

	a:hover :global(.drill-card) {
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		box-shadow: 0 26px 80px rgba(0, 0, 0, 0.28);
		transform: translateY(-4px);
	}

	.icon-shell {
		display: grid;
		width: 2.65rem;
		height: 2.65rem;
		place-items: center;
		border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
		border-radius: 0.9rem;
		background: var(--accent-soft);
		color: var(--accent);
	}

	.play-button {
		display: grid;
		width: 2.4rem;
		height: 2.4rem;
		place-items: center;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.04);
		color: white;
		transition:
			background-color 250ms ease,
			border-color 250ms ease,
			transform 250ms var(--ease-out-expo);
	}

	a:hover .play-button {
		border-color: color-mix(in srgb, var(--accent) 55%, transparent);
		background: var(--accent);
		transform: scale(1.06);
	}

	.score-line {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 60%, #fff), var(--accent));
		transition: width 900ms var(--ease-out-expo);
	}
</style>
