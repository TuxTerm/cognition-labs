<script lang="ts">
	import { resolve } from '$app/paths';
	type Props = {
		compact?: boolean;
	};
	let { compact = false }: Props = $props();
</script>

<a href={resolve('/')} class="group inline-flex items-center gap-3" aria-label="Cognitive Lab home">
	<span
		class="relative grid size-9 place-items-center overflow-hidden rounded-xl border border-violet-soft/30 bg-violet/15"
	>
		<svg viewBox="0 0 32 32" class="size-5" aria-hidden="true">
			<path
				d="M8 8h7v7H8zM17 8h7v7h-7zM8 17h7v7H8zM17 17h7v7h-7z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.7"
				class="text-violet-soft"
			/>
			<path
				d="M11.5 11.5h4M20.5 11.5v4M11.5 20.5v-4M20.5 20.5h-4"
				stroke="#fff"
				stroke-width="1.4"
			/>
		</svg>
		<span
			class="absolute inset-0 bg-violet/30 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
		></span>
	</span>
	{#if !compact}
		<span class="font-display text-[1.02rem] font-semibold tracking-[-0.035em] text-white">
			Cognitive<span class="text-violet-soft">Lab</span>
		</span>
	{/if}
</a>
