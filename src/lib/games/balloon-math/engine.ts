import { clamp, randomInt, type Rng } from '#lib/games/shared/rng';

export const SPRINT_MS = 90_000;
export const WRONG_PENALTY_MS = 3_000;

export type Balloon = {
	id: string;
	expression: string;
	value: number;
	tone: 'violet' | 'amber' | 'mint';
};

export type BalloonSet = {
	id: string;
	balloons: Balloon[];
	order: string[];
};

function makeExpression(level: number, rng: Rng): { expression: string; value: number } {
	if (level <= 1) {
		const kind = randomInt(rng, 0, 3);
		if (kind === 0) {
			const a = randomInt(rng, 12, 68);
			const b = randomInt(rng, 9, 49);
			return { expression: `${a} + ${b}`, value: a + b };
		}
		if (kind === 1) {
			const a = randomInt(rng, 42, 96);
			const b = randomInt(rng, 8, 39);
			return { expression: `${a} − ${b}`, value: a - b };
		}
		if (kind === 2) {
			const a = randomInt(rng, 3, 12);
			const b = randomInt(rng, 3, 9);
			return { expression: `${a} × ${b}`, value: a * b };
		}
		const divisor = randomInt(rng, 3, 9);
		const answer = randomInt(rng, 3, 12);
		return { expression: `${divisor * answer} ÷ ${divisor}`, value: answer };
	}

	if (level === 2) {
		const kind = randomInt(rng, 0, 4);
		if (kind === 0) {
			const a = randomInt(rng, 3, 9);
			const b = randomInt(rng, 3, 9);
			const c = randomInt(rng, 4, 25);
			return { expression: `${a} × ${b} + ${c}`, value: a * b + c };
		}
		if (kind === 1) {
			const a = randomInt(rng, 4, 9);
			const b = randomInt(rng, 4, 9);
			const c = randomInt(rng, 3, 18);
			return { expression: `${a} × ${b} − ${c}`, value: a * b - c };
		}
		if (kind === 2) {
			const a = randomInt(rng, 12, 45);
			const b = randomInt(rng, 3, 9);
			const c = randomInt(rng, 3, 8);
			return { expression: `${a} + ${b} × ${c}`, value: a + b * c };
		}
		if (kind === 3) {
			const divisor = randomInt(rng, 3, 9);
			const answer = randomInt(rng, 4, 12);
			const c = randomInt(rng, 4, 19);
			return { expression: `${divisor * answer} ÷ ${divisor} + ${c}`, value: answer + c };
		}
		const a = randomInt(rng, 45, 90);
		const b = randomInt(rng, 12, 44);
		const c = randomInt(rng, 3, 20);
		return { expression: `${a} − ${b} + ${c}`, value: a - b + c };
	}

	const kind = randomInt(rng, 0, 4);
	if (kind === 0) {
		const a = randomInt(rng, 3, 12);
		const b = randomInt(rng, 2, 9);
		const c = randomInt(rng, 2, 6);
		return { expression: `(${a} + ${b}) × ${c}`, value: (a + b) * c };
	}
	if (kind === 1) {
		const a = randomInt(rng, 20, 40);
		const b = randomInt(rng, 3, 14);
		const c = randomInt(rng, 2, 6);
		return { expression: `(${a} − ${b}) × ${c}`, value: (a - b) * c };
	}
	if (kind === 2) {
		const a = randomInt(rng, 4, 11);
		const b = randomInt(rng, 3, 9);
		const c = randomInt(rng, 3, 9);
		const d = randomInt(rng, 2, 7);
		return { expression: `${a} × ${b} − ${c} × ${d}`, value: a * b - c * d };
	}
	if (kind === 3) {
		const divisor = randomInt(rng, 3, 8);
		const answer = randomInt(rng, 5, 14);
		const c = randomInt(rng, 2, 6);
		return { expression: `(${divisor * answer} ÷ ${divisor}) × ${c}`, value: answer * c };
	}
	const a = randomInt(rng, 3, 12);
	const b = randomInt(rng, 3, 12);
	const c = randomInt(rng, 5, 40);
	return { expression: `${a} × ${b} + ${c}`, value: a * b + c };
}

export function generateSet(level: number, rng: Rng, setId: string): BalloonSet {
	let generated: { expression: string; value: number }[] = [];
	for (let attempt = 0; attempt < 80; attempt += 1) {
		const candidate = [
			makeExpression(level, rng),
			makeExpression(level, rng),
			makeExpression(level, rng)
		];
		if (
			candidate.every((item) => Number.isInteger(item.value) && item.value >= 0 && item.value < 500)
		) {
			const unique = new Set(candidate.map((item) => item.value));
			if (unique.size === 3) {
				generated = candidate;
				break;
			}
		}
	}

	if (generated.length !== 3) {
		generated = [
			{ expression: '8 + 7', value: 15 },
			{ expression: '6 × 4', value: 24 },
			{ expression: '9 × 5', value: 45 }
		];
	}

	const tones: Balloon['tone'][] = ['violet', 'amber', 'mint'];
	const balloons = generated.map((item, index) => ({
		...item,
		id: `${setId}-${index}`,
		tone: tones[index] ?? 'violet'
	}));
	const order = [...balloons].sort((a, b) => a.value - b.value).map((balloon) => balloon.id);
	return { id: setId, balloons, order };
}

export function sortedValues(set: BalloonSet): number[] {
	return [...set.balloons].map((balloon) => balloon.value).sort((a, b) => a - b);
}

export function sprintScore(setsCleared: number, correct: number, wrong: number): number {
	const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0;
	const pace = clamp((setsCleared / 8) * 100, 0, 100);
	return clamp(Math.round(accuracy * 0.62 + pace * 0.38), 0, 100);
}

export function clickAccuracy(correct: number, wrong: number): number {
	if (correct + wrong === 0) return 0;
	return Math.round((correct / (correct + wrong)) * 100);
}
