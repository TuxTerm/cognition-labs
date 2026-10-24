import { describe, expect, it } from 'vitest';
import {
	MAZE_KEY_COUNTS,
	MAZE_SIZES,
	MAZE_TIME_MS,
	allKeysReachable,
	generateMaze,
	mazeScore,
	moveFrom,
	solutionPath
} from './engine';
import { mulberry32 } from '#lib/games/shared/rng';

describe('hidden maze engine', () => {
	it('generates connected mazes with reachable keys', () => {
		for (let index = 0; index < MAZE_SIZES.length; index += 1) {
			const size = MAZE_SIZES[index] ?? 5;
			const keyCount = MAZE_KEY_COUNTS[index] ?? 1;
			for (let seed = 1; seed <= 10; seed += 1) {
				const maze = generateMaze(size, keyCount, mulberry32(seed * size + index));
				expect(maze.cells).toHaveLength(size * size);
				expect(solutionPath(maze).length).toBeGreaterThan(1);
				expect(allKeysReachable(maze)).toBe(true);
				expect(new Set(maze.keys).size).toBe(keyCount);
				expect(maze.keys).not.toContain(maze.start);
				expect(maze.keys).not.toContain(maze.goal);
			}
		}
	});

	it('resets to the start when a wall is hit', () => {
		const maze = generateMaze(5, 1, mulberry32(77));
		const wallDirection = [0, 1, 2, 3].find((direction) => moveFrom(maze, 0, direction).blocked);
		expect(wallDirection).not.toBeUndefined();
		const result = moveFrom(maze, 0, wallDirection ?? 0);
		expect(result.blocked).toBe(true);
		expect(result.position).toBe(maze.start);
	});

	it('can follow the generated solution path', () => {
		const maze = generateMaze(6, 2, mulberry32(1234));
		const path = solutionPath(maze);
		expect(path).toHaveLength(new Set(path).size);
		for (const cell of path) {
			expect(cell).toBeGreaterThanOrEqual(0);
			expect(cell).toBeLessThan(maze.size * maze.size);
		}
		expect(path[0]).toBe(maze.start);
		expect(path[path.length - 1]).toBe(maze.goal);
	});

	it('scores completion and remaining time', () => {
		const fullKeys = MAZE_KEY_COUNTS.reduce((total, count) => total + count, 0);
		expect(mazeScore(0, 0, 0, 0)).toBe(0);
		expect(mazeScore(MAZE_SIZES.length, fullKeys, MAZE_TIME_MS, 0)).toBe(100);
		expect(mazeScore(MAZE_SIZES.length, fullKeys, MAZE_TIME_MS, 20)).toBeLessThan(100);
	});
});
