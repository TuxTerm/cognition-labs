import { clamp, randomInt, type Rng } from '#lib/games/shared/rng';

export const LEVEL_SIZES = [3, 4, 5, 4, 5] as const;
export const LEVEL_TIME_MS = 90_000;

export const NORTH = 1;
export const EAST = 2;
export const SOUTH = 4;
export const WEST = 8;

export const DIRECTIONS = [
	{ bit: NORTH, dx: 0, dy: -1, opposite: SOUTH, label: 'north' },
	{ bit: EAST, dx: 1, dy: 0, opposite: WEST, label: 'east' },
	{ bit: SOUTH, dx: 0, dy: 1, opposite: NORTH, label: 'south' },
	{ bit: WEST, dx: -1, dy: 0, opposite: EAST, label: 'west' }
] as const;

export type MatrixLevel = {
	size: number;
	solution: number[];
};

export function rotateMask(mask: number, turns = 1): number {
	let result = mask;
	const count = ((turns % 4) + 4) % 4;
	for (let index = 0; index < count; index += 1) {
		let next = 0;
		if (result & NORTH) next |= EAST;
		if (result & EAST) next |= SOUTH;
		if (result & SOUTH) next |= WEST;
		if (result & WEST) next |= NORTH;
		result = next;
	}
	return result;
}

export function flipMask(mask: number): number {
	let result = 0;
	if (mask & NORTH) result |= NORTH;
	if (mask & EAST) result |= WEST;
	if (mask & SOUTH) result |= SOUTH;
	if (mask & WEST) result |= EAST;
	return result;
}

function generateTree(size: number, rng: Rng): number[] {
	const total = size * size;
	const masks = new Array<number>(total).fill(0);
	const visited = new Array<boolean>(total).fill(false);
	const stack: number[] = [0];
	visited[0] = true;

	while (stack.length > 0) {
		const current = stack[stack.length - 1];
		if (current === undefined) break;
		const x = current % size;
		const y = Math.floor(current / size);
		const options: { index: number; from: number; to: number }[] = [];

		for (const direction of DIRECTIONS) {
			const nx = x + direction.dx;
			const ny = y + direction.dy;
			if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
			const next = ny * size + nx;
			if (visited[next]) continue;
			options.push({ index: next, from: direction.bit, to: direction.opposite });
		}

		if (options.length === 0) {
			stack.pop();
			continue;
		}

		const choice = options[Math.floor(rng() * options.length)];
		if (!choice) continue;
		masks[current] = (masks[current] ?? 0) | choice.from;
		masks[choice.index] = (masks[choice.index] ?? 0) | choice.to;
		visited[choice.index] = true;
		stack.push(choice.index);
	}

	return masks;
}

export function generateLevel(size: number, rng: Rng): MatrixLevel {
	const solution = generateTree(size, rng);
	solution[0] = (solution[0] ?? 0) | WEST;
	const end = size * size - 1;
	solution[end] = (solution[end] ?? 0) | EAST;
	return { size, solution };
}

export function scrambleLevel(level: MatrixLevel, rng: Rng): number[] {
	const scrambled = level.solution.map((mask) => {
		const rotated = rotateMask(mask, randomInt(rng, 0, 3));
		return rng() > 0.65 ? flipMask(rotated) : rotated;
	});

	for (let attempt = 0; attempt < 12 && isSolved(scrambled, level.size); attempt += 1) {
		const index = randomInt(rng, 0, scrambled.length - 1);
		scrambled[index] = rotateMask(scrambled[index] ?? 0, 1);
	}

	return scrambled;
}

export function hasConnection(mask: number, direction: (typeof DIRECTIONS)[number]): boolean {
	return (mask & direction.bit) !== 0;
}

export type MatrixTrace = {
	depths: Map<number, number>;
	path: number[];
	connected: boolean;
};

export function traceFlow(tiles: number[], size: number): MatrixTrace {
	const depths = new Map<number, number>();
	const parents = new Map<number, number>();
	if (tiles.length !== size * size || !((tiles[0] ?? 0) & WEST)) {
		return { depths, path: [], connected: false };
	}

	const queue = [0];
	depths.set(0, 0);

	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined) continue;
		const mask = tiles[current] ?? 0;
		const x = current % size;
		const y = Math.floor(current / size);
		const depth = depths.get(current) ?? 0;

		for (const direction of DIRECTIONS) {
			if (!hasConnection(mask, direction)) continue;
			const nx = x + direction.dx;
			const ny = y + direction.dy;
			if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
			const next = ny * size + nx;
			if (depths.has(next)) continue;
			if (!((tiles[next] ?? 0) & direction.opposite)) continue;
			depths.set(next, depth + 1);
			parents.set(next, current);
			queue.push(next);
		}
	}

	const end = size * size - 1;
	const connected = depths.has(end) && Boolean((tiles[end] ?? 0) & EAST);
	if (!connected) return { depths, path: [], connected: false };

	const path = [end];
	let cursor = end;
	while (cursor !== 0) {
		const previous = parents.get(cursor);
		if (previous === undefined) break;
		path.push(previous);
		cursor = previous;
	}
	path.reverse();
	return { depths, path, connected: true };
}

export function isSolved(tiles: number[], size: number): boolean {
	return traceFlow(tiles, size).connected;
}

export function countConnections(mask: number): number {
	return DIRECTIONS.reduce((total, direction) => total + (mask & direction.bit ? 1 : 0), 0);
}

export function matrixScore(
	levelsCleared: number,
	timeRemainingMs: number,
	wrongChecks: number
): number {
	const completion = levelsCleared / LEVEL_SIZES.length;
	const timeRatio = clamp(timeRemainingMs / (LEVEL_TIME_MS * LEVEL_SIZES.length), 0, 1);
	const penalty = clamp(wrongChecks * 2.5, 0, 18);
	return clamp(Math.round(completion * 78 + timeRatio * 22 - penalty), 0, 100);
}
