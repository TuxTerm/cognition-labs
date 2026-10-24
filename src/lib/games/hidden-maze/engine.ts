import { EAST, NORTH, SOUTH, WEST } from '#lib/games/matrix-flow/engine';
import { clamp, type Rng } from '#lib/games/shared/rng';

export const MAZE_SIZES = [5, 6, 5, 7] as const;
export const MAZE_KEY_COUNTS = [1, 2, 2, 3] as const;
export const MAZE_TIME_MS = 360_000;

export const MAZE_DIRECTIONS = [
	{ bit: NORTH, dx: 0, dy: -1, opposite: SOUTH },
	{ bit: EAST, dx: 1, dy: 0, opposite: WEST },
	{ bit: SOUTH, dx: 0, dy: 1, opposite: NORTH },
	{ bit: WEST, dx: -1, dy: 0, opposite: EAST }
] as const;

export type HiddenMaze = {
	size: number;
	cells: number[];
	start: number;
	goal: number;
	keys: number[];
	keyCount: number;
};

export function generateMaze(size: number, keyCount: number, rng: Rng): HiddenMaze {
	const total = size * size;
	const cells = new Array<number>(total).fill(0);
	const visited = new Array<boolean>(total).fill(false);
	const stack = [0];
	visited[0] = true;

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		if (current === undefined) break;
		const x = current % size;
		const y = Math.floor(current / size);
		const options: { next: number; from: number; to: number }[] = [];

		for (const direction of MAZE_DIRECTIONS) {
			const nx = x + direction.dx;
			const ny = y + direction.dy;
			if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
			const next = ny * size + nx;
			if (visited[next]) continue;
			options.push({ next, from: direction.bit, to: direction.opposite });
		}

		if (options.length === 0) {
			stack.pop();
			continue;
		}

		const choice = options[Math.floor(rng() * options.length)];
		if (!choice) continue;
		cells[current] = (cells[current] ?? 0) | choice.from;
		cells[choice.next] = (cells[choice.next] ?? 0) | choice.to;
		visited[choice.next] = true;
		stack.push(choice.next);
	}

	const goal = total - 1;
	const keyCandidates = solutionPath({ size, cells, start: 0, goal, keys: [], keyCount }).filter(
		(cell) => cell !== 0 && cell !== goal
	);
	const keys: number[] = [];
	for (let index = 0; index < keyCount; index += 1) {
		const sliceStart = Math.floor((keyCandidates.length * index) / keyCount);
		const sliceEnd = Math.max(
			sliceStart + 1,
			Math.floor((keyCandidates.length * (index + 1)) / keyCount)
		);
		const slice = keyCandidates.slice(sliceStart, sliceEnd);
		if (slice.length > 0) {
			const key = slice[Math.floor(rng() * slice.length)];
			if (key !== undefined && !keys.includes(key)) keys.push(key);
		}
	}

	for (const candidate of keyCandidates) {
		if (keys.length >= keyCount) break;
		if (!keys.includes(candidate)) keys.push(candidate);
	}

	return { size, cells, start: 0, goal, keys, keyCount };
}

export function openingsAt(maze: Pick<HiddenMaze, 'cells'>, index: number): number {
	return maze.cells[index] ?? 0;
}

export function neighborFor(
	maze: Pick<HiddenMaze, 'size' | 'cells'>,
	from: number,
	directionIndex: number
): number | null {
	const direction = MAZE_DIRECTIONS[directionIndex];
	if (!direction) return null;
	const mask = openingsAt(maze, from);
	if (!(mask & direction.bit)) return null;
	const x = from % maze.size;
	const y = Math.floor(from / maze.size);
	const nx = x + direction.dx;
	const ny = y + direction.dy;
	if (nx < 0 || ny < 0 || nx >= maze.size || ny >= maze.size) return null;
	const next = ny * maze.size + nx;
	if (!(openingsAt(maze, next) & direction.opposite)) return null;
	return next;
}

export function moveFrom(
	maze: HiddenMaze,
	from: number,
	directionIndex: number
): { position: number; blocked: boolean; moved: boolean } {
	const next = neighborFor(maze, from, directionIndex);
	if (next === null) return { position: maze.start, blocked: true, moved: false };
	return { position: next, blocked: false, moved: true };
}

export function solutionPath(
	maze: Pick<HiddenMaze, 'size' | 'cells' | 'start' | 'goal' | 'keys' | 'keyCount'>
): number[] {
	const previous = new Map<number, number>();
	const queue = [maze.start];
	const visited = new Set([maze.start]);
	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined) continue;
		if (current === maze.goal) break;
		for (let directionIndex = 0; directionIndex < MAZE_DIRECTIONS.length; directionIndex += 1) {
			const next = neighborFor(maze, current, directionIndex);
			if (next === null || visited.has(next)) continue;
			visited.add(next);
			previous.set(next, current);
			queue.push(next);
		}
	}

	if (!visited.has(maze.goal)) return [];
	const path = [maze.goal];
	let cursor = maze.goal;
	while (cursor !== maze.start) {
		const parent = previous.get(cursor);
		if (parent === undefined) return [];
		path.push(parent);
		cursor = parent;
	}
	return path.reverse();
}

export function allKeysReachable(maze: HiddenMaze): boolean {
	const path = solutionPath(maze);
	const reachable = new Set(path);
	return maze.keys.every((key) => reachable.has(key));
}

export function mazeScore(
	mazesCleared: number,
	keysCollected: number,
	timeRemainingMs: number,
	resets: number
): number {
	const completion = (mazesCleared / MAZE_SIZES.length) * 70;
	const keyRatio =
		(keysCollected / MAZE_KEY_COUNTS.reduce((total, count) => total + count, 0)) * 10;
	const timeRatio = clamp(timeRemainingMs / MAZE_TIME_MS, 0, 1) * 20;
	const penalty = Math.min(12, resets * 0.8);
	return clamp(Math.round(completion + keyRatio + timeRatio - penalty), 0, 100);
}
