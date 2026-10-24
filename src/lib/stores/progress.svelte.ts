import { browser } from '$app/env';
import { GAMES, GAME_WEIGHTS, type GameSlug, type SkillKey } from '#lib/data/games';
import type { Attempt, GameResult } from '#lib/games/shared/types';

const STORAGE_KEY = 'cognitive-lab:v1';
const MAX_ATTEMPTS = 150;

export type GameStats = {
	attempts: number;
	best: number | null;
	bestAccuracy: number | null;
	average: number | null;
	lastPlayed: string | null;
};

export type RecordResult = {
	attempt: Attempt;
	isBest: boolean;
	previousBest: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isAttempt(value: unknown): value is Attempt {
	if (!isRecord(value)) return false;
	return (
		typeof value.id === 'string' &&
		typeof value.game === 'string' &&
		GAMES.some((game) => game.slug === value.game) &&
		typeof value.score === 'number' &&
		typeof value.accuracy === 'number' &&
		typeof value.durationMs === 'number' &&
		typeof value.playedAt === 'string' &&
		isRecord(value.metrics)
	);
}

function readAttempts(): Attempt[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(isAttempt).slice(0, MAX_ATTEMPTS);
	} catch {
		return [];
	}
}

function dayKey(value: string): string {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function previousDayKey(key: string): string {
	const date = new Date(new Date(`${key}T12:00:00`).getTime() - 86_400_000);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function makeId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

class ProgressStore {
	attempts = $state<Attempt[]>([]);
	loaded = $state(false);

	load(): void {
		if (!browser || this.loaded) return;
		this.attempts = readAttempts();
		this.loaded = true;
	}

	get totalAttempts(): number {
		return this.attempts.length;
	}

	get bests(): Record<GameSlug, number | null> {
		return {
			'matrix-flow': this.bestFor('matrix-flow'),
			'balloon-math': this.bestFor('balloon-math'),
			'hidden-maze': this.bestFor('hidden-maze')
		};
	}

	bestFor(slug: GameSlug): number | null {
		const scores = this.attempts
			.filter((attempt) => attempt.game === slug)
			.map((attempt) => attempt.score);
		return scores.length > 0 ? Math.max(...scores) : null;
	}

	statsFor(slug: GameSlug): GameStats {
		const attempts = this.attempts.filter((attempt) => attempt.game === slug);
		if (attempts.length === 0) {
			return { attempts: 0, best: null, bestAccuracy: null, average: null, lastPlayed: null };
		}
		const best = Math.max(...attempts.map((attempt) => attempt.score));
		const bestAccuracy = Math.max(...attempts.map((attempt) => attempt.accuracy));
		const average = Math.round(
			attempts.reduce((total, attempt) => total + attempt.score, 0) / attempts.length
		);
		const lastPlayed = attempts.reduce(
			(latest, attempt) => (attempt.playedAt > latest ? attempt.playedAt : latest),
			attempts[0]?.playedAt ?? ''
		);
		return { attempts: attempts.length, best, bestAccuracy, average, lastPlayed };
	}

	record(game: GameSlug, result: GameResult): RecordResult {
		this.load();
		const previousBest = this.bestFor(game);
		const attempt: Attempt = {
			...result,
			game,
			id: makeId(),
			playedAt: new Date().toISOString(),
			score: Math.max(0, Math.min(100, Math.round(result.score))),
			accuracy: Math.max(0, Math.min(100, Math.round(result.accuracy)))
		};
		this.attempts = [attempt, ...this.attempts].slice(0, MAX_ATTEMPTS);
		this.persist();
		return {
			attempt,
			isBest: previousBest === null || attempt.score > previousBest,
			previousBest
		};
	}

	get readiness(): number {
		const available = GAMES.filter((game) => this.bestFor(game.slug) !== null);
		if (available.length === 0) return 0;
		const weightTotal = available.reduce((total, game) => total + GAME_WEIGHTS[game.slug], 0);
		const weighted = available.reduce(
			(total, game) => total + (this.bestFor(game.slug) ?? 0) * GAME_WEIGHTS[game.slug],
			0
		);
		return Math.round(weighted / weightTotal);
	}

	get playedCount(): number {
		return GAMES.filter((game) => this.bestFor(game.slug) !== null).length;
	}

	get readinessLabel(): string {
		if (this.playedCount === 0) return 'Not calibrated';
		const value = this.readiness;
		if (this.playedCount < GAMES.length) return 'Provisional';
		if (value >= 90) return 'Elite';
		if (value >= 75) return 'Assessment ready';
		if (value >= 60) return 'Sharp';
		if (value >= 40) return 'Building';
		return 'Baseline';
	}

	get skillScores(): Record<SkillKey, number | null> {
		return {
			logic: this.bestFor('matrix-flow'),
			numerical: this.bestFor('balloon-math'),
			spatial: this.bestFor('hidden-maze')
		};
	}

	get recommendedGame(): GameSlug {
		const unplayed = GAMES.find((game) => this.bestFor(game.slug) === null);
		if (unplayed) return unplayed.slug;
		return GAMES.reduce(
			(weakest, game) => {
				const weakestScore = this.bestFor(weakest.slug) ?? 0;
				const score = this.bestFor(game.slug) ?? 0;
				return score < weakestScore ? game : weakest;
			},
			GAMES[0] as (typeof GAMES)[number]
		).slug;
	}

	get streak(): { current: number; longest: number } {
		if (this.attempts.length === 0) return { current: 0, longest: 0 };
		const days = [...new Set(this.attempts.map((attempt) => dayKey(attempt.playedAt)))]
			.sort()
			.reverse();
		const today = dayKey(new Date().toISOString());
		const yesterday = previousDayKey(today);
		let current = 0;
		if (days[0] === today || days[0] === yesterday) {
			let cursor = days[0] ?? today;
			for (const day of days) {
				if (day === cursor) {
					current += 1;
					cursor = previousDayKey(cursor);
				} else if (day < cursor) {
					break;
				}
			}
		}
		let longest = 0;
		let run = 0;
		let previous: string | null = null;
		for (const day of [...days].sort()) {
			if (previous && previousDayKey(day) === previous) {
				run += 1;
			} else {
				run = 1;
			}
			longest = Math.max(longest, run);
			previous = day;
		}
		return { current, longest };
	}

	get recentAttempts(): Attempt[] {
		return this.attempts.slice(0, 6);
	}

	reset(): void {
		this.attempts = [];
		this.loaded = true;
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	private persist(): void {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.attempts));
		} catch {
			// Storage may be full or unavailable; progress remains in memory.
		}
	}
}

export const progress = new ProgressStore();
