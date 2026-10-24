import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function revealOnScroll(root: HTMLElement): () => void {
	if (prefersReducedMotion()) return () => undefined;
	gsap.registerPlugin(ScrollTrigger);
	const context = gsap.context(() => {
		const elements = gsap.utils.toArray<HTMLElement>('[data-reveal]');
		elements.forEach((element) => {
			gsap.fromTo(
				element,
				{ autoAlpha: 0, y: 28 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.9,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: element,
						start: 'top 88%',
						once: true
					}
				}
			);
		});
	}, root);
	return () => context.revert();
}

export function countUp(
	node: HTMLElement,
	value: number,
	options: { duration?: number; suffix?: string; decimals?: number } = {}
): () => void {
	const { duration = 1.1, suffix = '', decimals = 0 } = options;
	if (prefersReducedMotion()) {
		node.textContent = `${value.toFixed(decimals)}${suffix}`;
		return () => undefined;
	}
	const state = { value: 0 };
	const tween = gsap.to(state, {
		value,
		duration,
		ease: 'power2.out',
		onUpdate: () => {
			node.textContent = `${state.value.toFixed(decimals)}${suffix}`;
		}
	});
	return () => tween.kill();
}
