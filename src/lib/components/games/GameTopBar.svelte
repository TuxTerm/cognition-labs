<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Pause, X } from '@lucide/svelte';
	import type { GameMeta } from '#lib/data/games';

	type Props = {
		meta: GameMeta;
		levelLabel: string;
		timer: string;
		progress: number;
		urgent?: boolean;
		onPause: () => void;
		onQuit: () => void;
		stats?: Snippet;
	};
	let {
		meta,
		levelLabel,
		timer,
		progress,
		urgent = false,
		onPause,
		onQuit,
		stats
	}: Props = $props();
</script>

<div class="game-topbar">
	<div class="lab-container-wide">
		<div class="flex min-h-[74px] items-center justify-between gap-4 py-3">
			<div class="flex min-w-0 items-center gap-3">
				<button
					type="button"
					class="icon-button"
					onclick={onQuit}
					aria-label="End run and return to briefing"
				>
					<X size={16} />
				</button>
				<div class="hidden min-w-0 sm:block">
					<div class="truncate font-display text-sm font-semibold tracking-[-0.02em] text-white">
						{meta.name}
					</div>
					<div class="mt-0.5 text-[0.62rem] tracking-[0.15em] text-fog uppercase">{levelLabel}</div>
				</div>
			</div>

			<div class="hidden items-center justify-center md:flex">
				{@render stats?.()}
			</div>

			<div class="flex items-center gap-2.5">
				<div class="timer-pill" class:urgent>
					<span class="timer-dot"></span>
					<span class="font-display text-sm tabular-nums">{timer}</span>
				</div>
				<button type="button" class="icon-button" onclick={onPause} aria-label="Pause run">
					<Pause size={15} fill="currentColor" />
				</button>
			</div>
		</div>

		<div class="h-1 overflow-hidden rounded-full bg-white/[0.055]">
			<div
				class="h-full rounded-full transition-[width] duration-300"
				style:width={`${Math.max(0, Math.min(100, progress))}%`}
				style:background={urgent ? '#ff7b7b' : meta.accent}
			></div>
		</div>
	</div>
</div>

<style>
	.game-topbar {
		position: fixed;
		inset: 0 0 auto;
		z-index: 70;
		border-bottom: 1px solid rgba(255, 255, 255, 0.065);
		background: rgba(8, 6, 13, 0.84);
		backdrop-filter: blur(20px);
	}

	.icon-button {
		display: grid;
		width: 2.3rem;
		height: 2.3rem;
		flex: none;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-mist);
		transition:
			background-color 180ms ease,
			color 180ms ease;
	}

	.icon-button:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
	}

	.timer-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		padding: 0.5rem 0.72rem;
		background: rgba(255, 255, 255, 0.03);
		color: white;
	}

	.timer-pill.urgent {
		border-color: rgba(255, 123, 123, 0.22);
		background: rgba(255, 82, 82, 0.08);
		color: #ffb7b7;
	}

	.timer-dot {
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: currentColor;
		opacity: 0.75;
	}

	.timer-pill.urgent .timer-dot {
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.2;
		}
	}
</style>
