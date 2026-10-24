<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '#lib/components/Logo.svelte';

	const year = new Date().getFullYear();
</script>

<footer class="relative mt-24 border-t border-white/[0.06] bg-surface/40">
	<div class="lab-container-wide py-12">
		<div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
			<div class="max-w-sm space-y-5">
				<Logo />
				<p class="text-sm leading-6 text-fog">
					Independent, game-based cognitive training for high-pressure assessments. Three focused
					drills. No signup. Progress stays in your browser.
				</p>
				<div
					class="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.14em] text-fog uppercase"
				>
					<span class="size-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(183,247,216,0.7)]"></span>
					Local-first · zero tracking
				</div>
			</div>

			<div>
				<div class="mb-4 text-[0.65rem] font-bold tracking-[0.18em] text-fog uppercase">Train</div>
				<ul class="space-y-2.5 text-sm text-mist">
					<li><a class="footer-link" href={resolve('/dashboard')}>Training floor</a></li>
					<li>
						<a class="footer-link" href={resolve('/games/[slug]', { slug: 'matrix-flow' })}
							>Matrix Flow</a
						>
					</li>
					<li>
						<a class="footer-link" href={resolve('/games/[slug]', { slug: 'balloon-math' })}
							>Balloon Math</a
						>
					</li>
					<li>
						<a class="footer-link" href={resolve('/games/[slug]', { slug: 'hidden-maze' })}
							>Hidden Maze</a
						>
					</li>
				</ul>
			</div>

			<div>
				<div class="mb-4 text-[0.65rem] font-bold tracking-[0.18em] text-fog uppercase">
					Built with
				</div>
				<ul class="space-y-2.5 text-sm text-mist">
					<li>
						<a class="footer-link" href="https://svelte.dev" target="_blank" rel="noreferrer"
							>Svelte 5</a
						>
					</li>
					<li>
						<a class="footer-link" href="https://lenis.dev" target="_blank" rel="noreferrer"
							>Lenis</a
						>
					</li>
					<li>
						<a class="footer-link" href="https://gsap.com" target="_blank" rel="noreferrer">GSAP</a>
					</li>
					<li>
						<a class="footer-link" href="https://sveltebits.xyz" target="_blank" rel="noreferrer"
							>Svelte Bits</a
						>
					</li>
				</ul>
			</div>
		</div>

		<div
			class="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-6 text-xs leading-5 text-fog md:flex-row md:items-start md:justify-between"
		>
			<p>© {year} Cognitive Lab. A practice tool, not an official assessment.</p>
			<p class="max-w-xl md:text-right">
				Not affiliated with Accenture. Game formats are inspired by publicly described cognitive
				assessments; all code and content are original.
			</p>
		</div>
	</div>
</footer>

<style>
	.footer-link {
		transition: color 180ms ease;
	}

	.footer-link:hover {
		color: white;
	}
</style>
