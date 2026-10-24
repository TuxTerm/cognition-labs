<script lang="ts">
	import './layout.css';
	import '@fontsource-variable/space-grotesk';
	import '@fontsource-variable/inter';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Footer from '#lib/components/Footer.svelte';
	import Navbar from '#lib/components/Navbar.svelte';
	import {
		destroySmoothScroll,
		initSmoothScroll,
		refreshScrollTriggers,
		scrollToTop
	} from '#lib/motion/lenis';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const isGameRoute = $derived(page.url.pathname.startsWith('/games/'));

	onMount(() => {
		initSmoothScroll();
		return () => destroySmoothScroll();
	});

	afterNavigate(({ type }) => {
		if (type === 'goto' || type === 'popstate') scrollToTop(true);
		requestAnimationFrame(() => refreshScrollTriggers());
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to content</a>

{#if !isGameRoute}
	<Navbar />
{/if}

<main id="main-content">
	{@render children()}
</main>

{#if !isGameRoute}
	<Footer />
{/if}

<style>
	.skip-link {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 200;
		transform: translateY(-160%);
		border-radius: 999px;
		padding: 0.7rem 1rem;
		background: white;
		color: black;
		font-size: 0.8rem;
		font-weight: 600;
		transition: transform 180ms ease;
	}

	.skip-link:focus {
		transform: translateY(0);
	}
</style>
