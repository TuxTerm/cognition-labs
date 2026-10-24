<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Menu, X, ArrowUpRight } from '@lucide/svelte';
	import Logo from '#lib/components/Logo.svelte';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/dashboard', label: 'Training' },
		{ href: '/about', label: 'Method' }
	] as const;

	let open = $state(false);
	let scrolled = $state(false);

	$effect(() => {
		void page.url.pathname;
		open = false;
	});

	function onScroll(): void {
		scrolled = window.scrollY > 16;
	}

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:window onscroll={onScroll} />

<header class="nav-shell" class:is-scrolled={scrolled}>
	<nav
		class="lab-container-wide flex h-[var(--nav-height)] items-center justify-between"
		aria-label="Main navigation"
	>
		<Logo />

		<div class="hidden items-center gap-1 md:flex">
			{#each links as link (link.href)}
				<a
					href={resolve(link.href)}
					class="nav-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-2.5">
			<a
				href={resolve('/dashboard')}
				class="btn btn-primary hidden !min-h-10 !px-4 !py-2 text-[0.78rem] sm:inline-flex"
			>
				Start training
				<ArrowUpRight size={15} strokeWidth={2.1} />
			</a>
			<button
				type="button"
				class="grid size-10 place-items-center rounded-full border border-line bg-white/[0.03] text-mist transition-colors hover:bg-white/[0.07] hover:text-white md:hidden"
				aria-label={open ? 'Close menu' : 'Open menu'}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				{#if open}
					<X size={18} />
				{:else}
					<Menu size={18} />
				{/if}
			</button>
		</div>
	</nav>

	{#if open}
		<div class="mobile-menu md:hidden">
			<div class="lab-container flex flex-col gap-1 py-5">
				{#each links as link (link.href)}
					<a
						href={resolve(link.href)}
						class="mobile-link"
						class:active={isActive(link.href)}
						onclick={() => (open = false)}
					>
						<span>{link.label}</span>
						<ArrowUpRight size={16} />
					</a>
				{/each}
				<a
					href={resolve('/dashboard')}
					class="btn btn-primary mt-3 w-full"
					onclick={() => (open = false)}
				>
					Start training
					<ArrowUpRight size={16} />
				</a>
			</div>
		</div>
	{/if}
</header>

<style>
	.nav-shell {
		position: fixed;
		inset: 0 0 auto;
		z-index: 80;
		border-bottom: 1px solid transparent;
		transition:
			background-color 300ms ease,
			border-color 300ms ease,
			backdrop-filter 300ms ease;
	}

	.nav-shell.is-scrolled {
		border-bottom-color: rgba(255, 255, 255, 0.07);
		background: rgba(8, 6, 13, 0.76);
		backdrop-filter: blur(18px);
	}

	.nav-link {
		position: relative;
		border-radius: 999px;
		padding: 0.55rem 0.9rem;
		color: var(--color-fog);
		font-size: 0.8rem;
		font-weight: 550;
		transition:
			color 180ms ease,
			background-color 180ms ease;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.045);
		color: white;
	}

	.nav-link.active {
		color: white;
	}

	.nav-link.active::after {
		position: absolute;
		bottom: 0.24rem;
		left: 50%;
		width: 3px;
		height: 3px;
		border-radius: 999px;
		background: var(--color-violet-soft);
		content: '';
		transform: translateX(-50%);
		box-shadow: 0 0 8px var(--color-violet);
	}

	.mobile-menu {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		background: rgba(8, 6, 13, 0.97);
		backdrop-filter: blur(24px);
	}

	.mobile-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 0.8rem;
		padding: 0.9rem 0.7rem;
		color: var(--color-mist);
		font-family: var(--font-display);
		font-size: 1.2rem;
	}

	.mobile-link:hover,
	.mobile-link.active {
		background: rgba(255, 255, 255, 0.045);
		color: white;
	}
</style>
