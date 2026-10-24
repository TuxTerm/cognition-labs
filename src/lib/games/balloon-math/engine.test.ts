import { describe, expect, it } from 'vitest';
import { clickAccuracy, generateSet, sortedValues, sprintScore } from './engine';
import { mulberry32 } from '#lib/games/shared/rng';

describe('balloon math engine', () => {
	it('generates three unique answers in ascending order', () => {
		for (let seed = 1; seed <= 30; seed += 1) {
			const set = generateSet((seed % 3) + 1, mulberry32(seed), `set-${seed}`);
			expect(set.balloons).toHaveLength(3);
			expect(new Set(set.balloons.map((balloon) => balloon.value)).size).toBe(3);
			const sorted = sortedValues(set);
			expect(set.order).toHaveLength(3);
			const orderedValues = set.order.map(
				(id) => set.balloons.find((balloon) => balloon.id === id)?.value ?? -1
			);
			expect(orderedValues).toEqual(sorted);
		}
	});

	it('keeps every expression value non-negative and finite', () => {
		for (let seed = 1; seed <= 50; seed += 1) {
			const set = generateSet(3, mulberry32(seed), `set-${seed}`);
			for (const balloon of set.balloons) {
				expect(balloon.value).toBeGreaterThanOrEqual(0);
				expect(Number.isInteger(balloon.value)).toBe(true);
			}
		}
	});

	it('calculates click accuracy', () => {
		expect(clickAccuracy(0, 0)).toBe(0);
		expect(clickAccuracy(3, 1)).toBe(75);
		expect(clickAccuracy(10, 0)).toBe(100);
	});

	it('rewards accuracy and pace', () => {
		expect(sprintScore(8, 24, 0)).toBe(100);
		expect(sprintScore(0, 0, 0)).toBe(0);
		expect(sprintScore(4, 12, 2)).toBeGreaterThan(sprintScore(2, 6, 4));
	});
});
