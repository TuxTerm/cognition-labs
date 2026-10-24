<script lang="ts">
	import type { GameMeta } from '#lib/data/games';

	type Props = {
		icon: GameMeta['icon'];
		class?: string;
	};
	let { icon, class: className = 'size-6' }: Props = $props();
</script>

{#if icon === 'grid'}
	<svg viewBox="0 0 32 32" class={className} fill="none" aria-hidden="true">
		<path
			d="M5 10h6V5M16 5h6v5M22 16h5M27 22h-6v5M16 27h-6v-5M10 22H5M5 16h5"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
		/>
		<circle cx="16" cy="16" r="4.25" stroke="currentColor" stroke-width="1.7" />
		<circle cx="16" cy="16" r="1.3" fill="currentColor" />
	</svg>
{:else if icon === 'balloon'}
	<svg viewBox="0 0 32 32" class={className} fill="none" aria-hidden="true">
		<ellipse cx="11" cy="11" rx="5.6" ry="6.6" stroke="currentColor" stroke-width="1.6" />
		<ellipse cx="22" cy="15" rx="4.6" ry="5.5" stroke="currentColor" stroke-width="1.6" />
		<path
			d="M11 17.8c0 2.3 1.2 3 1.2 4.2M22 20.8c0 1.8-.8 2.6-.8 3.7"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
		/>
		<path
			d="M8.5 10.8c.7-1.7 2.1-2.6 3.5-2.8M20.2 14.6c.5-1.2 1.5-2 2.6-2.2"
			stroke="currentColor"
			stroke-width="1.4"
			stroke-linecap="round"
			opacity=".55"
		/>
	</svg>
{:else}
	<svg viewBox="0 0 32 32" class={className} fill="none" aria-hidden="true">
		<path
			d="M6 6h8v8H6zM18 6h8v8h-8zM6 18h8v8H6zM18 18h8v8h-8z"
			stroke="currentColor"
			stroke-width="1.4"
			opacity=".35"
		/>
		<path
			d="M9 9h5v9h6v5h7"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<circle cx="9" cy="9" r="2" fill="currentColor" />
		<circle cx="27" cy="23" r="2" fill="currentColor" />
	</svg>
{/if}
