<script lang="ts">
	import { LogOut, X } from '@lucide/svelte';

	type Props = {
		open: boolean;
		onCancel: () => void;
		onConfirm: () => void;
	};
	let { open, onCancel, onConfirm }: Props = $props();
</script>

{#if open}
	<div class="quit-backdrop" role="presentation">
		<div class="quit-panel" role="dialog" aria-modal="true" aria-labelledby="quit-title">
			<button type="button" class="quit-close" aria-label="Cancel" onclick={onCancel}>
				<X size={15} />
			</button>
			<div
				class="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-mist"
			>
				<LogOut size={18} />
			</div>
			<h2
				id="quit-title"
				class="mt-5 font-display text-2xl font-semibold tracking-[-0.04em] text-white"
			>
				End this run?
			</h2>
			<p class="mt-2.5 text-sm leading-6 text-fog">
				Your current progress will be discarded. Completed runs stay saved in your history.
			</p>
			<div class="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
				<button type="button" class="btn btn-danger flex-1" onclick={onConfirm}>End run</button>
				<button type="button" class="btn btn-secondary flex-1" onclick={onCancel}
					>Keep playing</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.quit-backdrop {
		position: fixed;
		inset: 0;
		z-index: 125;
		display: grid;
		place-items: center;
		padding: 1.25rem;
		background: rgba(4, 3, 7, 0.76);
		backdrop-filter: blur(18px);
		animation: fade-in 160ms ease both;
	}

	.quit-panel {
		position: relative;
		width: min(100%, 25rem);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 1.6rem;
		padding: 1.75rem;
		background:
			radial-gradient(ellipse at 20% 0%, rgba(255, 100, 100, 0.09), transparent 60%),
			var(--color-panel);
		box-shadow: 0 40px 120px rgba(0, 0, 0, 0.55);
		animation: panel-in 260ms var(--ease-out-expo) both;
	}

	.quit-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		color: var(--color-fog);
	}

	.quit-close:hover {
		color: white;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(10px) scale(0.985);
		}
	}
</style>
