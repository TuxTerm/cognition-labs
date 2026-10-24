export type Rng = () => number;

export function mulberry32(seed: number): Rng {
	let value = seed >>> 0;
	return () => {
		value += 0x6d2b79f5;
		let t = value;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function randomSeed(): number {
	if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
		return crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now();
	}
	return Math.floor(Math.random() * 0xffffffff);
}

export function randomInt(rng: Rng, min: number, max: number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: Rng, values: readonly T[]): T {
	const value = values[Math.floor(rng() * values.length)];
	if (value === undefined) throw new Error('Cannot pick from an empty array');
	return value;
}

export function shuffle<T>(rng: Rng, values: readonly T[]): T[] {
	const result = [...values];
	for (let index = result.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(rng() * (index + 1));
		const current = result[index];
		const swap = result[swapIndex];
		if (current === undefined || swap === undefined) continue;
		result[index] = swap;
		result[swapIndex] = current;
	}
	return result;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
