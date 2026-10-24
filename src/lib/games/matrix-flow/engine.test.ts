import { describe, expect, it } from 'vitest';
import {
	EAST,
	LEVEL_SIZES,
	LEVEL_TIME_MS,
	NORTH,
	WEST,
	flipMask,
	generateLevel,
	isSolved,
	matrixScore,
	rotateMask,
	scrambleLevel,
	traceFlow
} from './engine';
import { mulberry32 } from '#lib/games/shared/rng';

describe('matrix flow engine', () => {
	it('rotates and flips masks reversibly', () => {
		const mask = NORTH | EAST | WEST;
		expect(rotateMask(mask, 4)).toBe(mask);
		expect(flipMask(flipMask(mask))).toBe(mask);
		expect(rotateMask(NORTH, 1)).toBe(EAST);
		expect(rotateMask(NORTH, 4)).toBe(NORTH);
		expect(flipMask(EAST | WEST)).toBe(EAST | WEST);
	});

	it('generates solvable levels for every size', () => {
		for (const size of LEVEL_SIZES) {
			const level = generateLevel(size, mulberry32(size * 71));
			expect(level.solution).toHaveLength(size * size);
			expect(level.solution[0]! & WEST).toBeTruthy();
			expect(level.solution[size * size - 1]! & EAST).toBeTruthy();
			expect(isSolved(level.solution, size)).toBe(true);
		}
	});

	it('scrambles a level into a non-solved state', () => {
		const level = generateLevel(4, mulberry32(9001));
		const scrambled = scrambleLevel(level, mulberry32(9002));
		expect(isSolved(scrambled, level.size)).toBe(false);
		expect(scrambled).not.toEqual(level.solution);
	});

	it('traces a directional path from the west entry to the east exit', () => {
		const level = generateLevel(4, mulberry32(4242));
		const trace = traceFlow(level.solution, level.size);
		const end = level.size * level.size - 1;

		expect(trace.connected).toBe(true);
		expect(trace.depths.get(0)).toBe(0);
		expect(trace.path.at(0)).toBe(0);
		expect(trace.path.at(-1)).toBe(end);
		expect([...trace.depths.keys()].every((index) => trace.depths.get(index)! >= 0)).toBe(true);

		const blocked = level.solution.map((mask, index) => (index === 0 ? mask & ~WEST : mask));
		const blockedTrace = traceFlow(blocked, level.size);
		expect(blockedTrace.connected).toBe(false);
		expect(blockedTrace.depths.size).toBe(0);
	});

	it('never awards a negative score', () => {
		const fullTime = LEVEL_TIME_MS * LEVEL_SIZES.length;
		expect(matrixScore(0, 0, 99)).toBe(0);
		expect(matrixScore(LEVEL_SIZES.length, fullTime, 0)).toBe(100);
	});

	it('scores completion above time-only performance', () => {
		const fullTime = LEVEL_TIME_MS * LEVEL_SIZES.length;
		expect(matrixScore(2, 0, 0)).toBeGreaterThan(matrixScore(0, fullTime, 0));
	});
});
