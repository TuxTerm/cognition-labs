<script lang="ts">
	import { GAME_MAP } from '#lib/data/games';
	import MatrixFlowGame from '#lib/components/games/MatrixFlowGame.svelte';
	import BalloonMathGame from '#lib/components/games/BalloonMathGame.svelte';
	import HiddenMazeGame from '#lib/components/games/HiddenMazeGame.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const meta = $derived(GAME_MAP[data.slug]);
</script>

<svelte:head>
	<title>{meta.name} — Cognitive Lab</title>
	<meta name="description" content={`${meta.tagline} ${meta.description}`} />
</svelte:head>

{#if data.slug === 'matrix-flow'}
	<MatrixFlowGame {meta} />
{:else if data.slug === 'balloon-math'}
	<BalloonMathGame {meta} />
{:else}
	<HiddenMazeGame {meta} />
{/if}
