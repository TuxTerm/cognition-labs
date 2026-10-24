<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '#lib/motion/reveal';

	type Props = {
		onComplete: () => void;
		label?: string;
	};
	let { onComplete, label = 'Focus' }: Props = $props();
	let count = $state(3);
	let complete = $state(false);

	onMount(() => {
		if (prefersReducedMotion()) {
			onComplete();
			return;
		}
		const interval = window.setInterval(() => {
			if (count <= 1) {
				window.clearInterval(interval);
				complete = true;
				window.setTimeout(onComplete, 520);
				count = 0;
				return;
			}
			count -= 1;
		}, 780);
		return () => window.clearInterval(interval);
	});
</script>

<div class="countdown-backdrop" aria-live="assertive">
	<div class="text-[0.62rem] font-bold tracking-[0.28em] text-violet-soft uppercase">{label}</div>
	{#key count}
		<div class="countdown-number" class:go={complete}>
			{#if complete}
				GO
			{:else}
				{count}
			{/if}
		</div>
	{/key}
	<div class="mt-3 text-xs text-fog">Breathe. Then move.</div>
</div>

<style>
	.countdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 120;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(4, 3, 7, 0.86);
		backdrop-filter: blur(22px);
	}

	.countdown-number {
		margin-top: 0.75rem;
		color: white;
		font-family: var(--font-display);
		font-size: clamp(7rem, 22vw, 14rem);
		font-weight: 600;
		line-height: 0.9;
		letter-spacing: -0.09em;
		text-shadow: 0 0 90px rgba(161, 0, 255, 0.45);
		animation: count-in 600ms var(--ease-out-expo) both;
	}

	.countdown-number.go {
		color: var(--color-violet-soft);
		font-size: clamp(4.5rem, 16vw, 9rem);
		letter-spacing: -0.06em;
	}

	@keyframes count-in {
		from {
			opacity: 0;
			transform: translateY(22px) scale(0.94);
		}
	}
</style>
