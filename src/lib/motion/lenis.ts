import { browser } from '$app/env';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

let instance: Lenis | null = null;
let tickerHandler: ((time: number) => void) | null = null;

export function initSmoothScroll(): void {
	if (!browser || instance) return;
	gsap.registerPlugin(ScrollTrigger);
	instance = new Lenis({
		duration: 1.1,
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		smoothWheel: true,
		touchMultiplier: 1.35,
		anchors: { offset: -88 }
	});
	instance.on('scroll', ScrollTrigger.update);
	tickerHandler = (time) => instance?.raf(time * 1000);
	gsap.ticker.add(tickerHandler);
	gsap.ticker.lagSmoothing(0);
}

export function destroySmoothScroll(): void {
	if (tickerHandler) gsap.ticker.remove(tickerHandler);
	instance?.destroy();
	instance = null;
	tickerHandler = null;
}

export function stopPageScroll(): void {
	instance?.stop();
	document.documentElement.classList.add('lenis-stopped');
}

export function startPageScroll(): void {
	instance?.start();
	document.documentElement.classList.remove('lenis-stopped');
}

export function scrollToTop(immediate = true): void {
	if (!browser) return;
	if (instance) {
		instance.scrollTo(0, { immediate });
	} else {
		window.scrollTo({ top: 0, behavior: 'auto' });
	}
}

export function refreshScrollTriggers(): void {
	if (!browser) return;
	ScrollTrigger.refresh();
}
