<script lang="ts">
	import { Play, RotateCcw, LogOut } from '@lucide/svelte';

	type Props = {
		open: boolean;
		onResume: () => void;
		onRestart: () => void;
		onQuit: () => void;
	};
	let { open, onResume, onRestart, onQuit }: Props = $props();
</script>

{#if open}
	<div class="pause-backdrop" role="dialog" aria-modal="true" aria-label="Run paused">
		<div class="pause-panel">
			<div class="eyebrow">Intermission</div>
			<h2 class="mt-4 font-display text-4xl font-semibold tracking-[-0.055em] text-white">
				Paused.
			</h2>
			<p class="mt-3 max-w-xs text-sm leading-6 text-fog">
				The clock is stopped. Take a breath, then get back under pressure.
			</p>
			<div class="mt-8 grid gap-2.5">
				<button type="button" class="btn btn-primary w-full" onclick={onResume}>
					<Play size={15} fill="currentColor" />
					Resume run
				</button>
				<button type="button" class="btn btn-secondary w-full" onclick={onRestart}>
					<RotateCcw size={15} />
					Restart drill
				</button>
				<button type="button" class="btn btn-ghost w-full" onclick={onQuit}>
					<LogOut size={15} />
					End run
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.pause-backdrop {
		position: fixed;
		inset: 0;
		z-index: 110;
		display: grid;
		place-items: center;
		padding: 1.25rem;
		background: rgba(4, 3, 7, 0.74);
		backdrop-filter: blur(18px);
		animation: fade-in 180ms ease both;
	}

	.pause-panel {
		width: min(100%, 26rem);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 1.75rem;
		padding: 2rem;
		background:
			radial-gradient(ellipse at 25% 0%, rgba(161, 0, 255, 0.16), transparent 60%),
			var(--color-panel);
		box-shadow: 0 40px 120px rgba(0, 0, 0, 0.55);
		animation: panel-in 300ms var(--ease-out-expo) both;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.985);
		}
	}
</style>
