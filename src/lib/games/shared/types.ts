import type { GameSlug } from '#lib/data/games';

export type GameResult = {
	score: number;
	accuracy: number;
	durationMs: number;
	metrics: Record<string, number>;
};

export type Attempt = GameResult & {
	id: string;
	game: GameSlug;
	playedAt: string;
};

export type GamePhase = 'intro' | 'countdown' | 'playing' | 'paused' | 'results';

export type GameMode = 'practice' | 'assessment';

export type GameSession = {
	startedAt: number;
	mode: GameMode;
};
