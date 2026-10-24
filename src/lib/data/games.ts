export type GameSlug = 'matrix-flow' | 'balloon-math' | 'hidden-maze';

export type SkillKey = 'logic' | 'numerical' | 'spatial';

export type GameMeta = {
	slug: GameSlug;
	name: string;
	number: string;
	tag: string;
	tagline: string;
	description: string;
	skill: SkillKey;
	skillLabel: string;
	duration: string;
	difficulty: string;
	accent: string;
	softAccent: string;
	icon: 'grid' | 'balloon' | 'maze';
	rules: string[];
	controls: string[];
	metrics: { key: string; label: string; suffix?: string }[];
};

export const GAMES: GameMeta[] = [
	{
		slug: 'matrix-flow',
		name: 'Matrix Flow',
		number: '01',
		tag: 'Logic · Patterns',
		tagline: 'Link IN to OUT. Beat the clock.',
		description:
			'Rotate and flip a grid of fractured pathways until the signal flows from the IN tile in the top-left to the OUT tile in the bottom-right. Five levels with shuffled layouts, building from 3×3 to 5×5.',
		skill: 'logic',
		skillLabel: 'Logical reasoning',
		duration: '5 levels · 90s each',
		difficulty: 'Progressive',
		accent: '#a100ff',
		softAccent: 'rgba(161, 0, 255, 0.14)',
		icon: 'grid',
		rules: [
			'The signal enters at IN in the top-left and must reach OUT in the bottom-right through one unbroken path.',
			'Click a tile to rotate it. Use Flip to mirror a selected tile when a rotation is not enough.',
			'Press Check when your route is ready. A wrong check costs time.',
			'Complete all five grids before their individual timers expire.'
		],
		controls: ['Click to rotate', 'R to rotate', 'F to flip', 'Check to validate'],
		metrics: [
			{ key: 'levels', label: 'Levels cleared' },
			{ key: 'checks', label: 'Checks' },
			{ key: 'wrongChecks', label: 'Wrong checks' },
			{ key: 'timeRemaining', label: 'Time left', suffix: 's' }
		]
	},
	{
		slug: 'balloon-math',
		name: 'Balloon Math',
		number: '02',
		tag: 'Arithmetic · Speed',
		tagline: 'Solve fast. Pop in order.',
		description:
			'Three floating equations, one correct sequence. Evaluate each answer and pop the balloons from lowest to highest before the clock runs dry.',
		skill: 'numerical',
		skillLabel: 'Numerical fluency',
		duration: '90-second sprint',
		difficulty: 'Adaptive',
		accent: '#ffb86b',
		softAccent: 'rgba(255, 184, 107, 0.12)',
		icon: 'balloon',
		rules: [
			'Each set contains three balloons with a different arithmetic expression.',
			'Pop the balloons in ascending order, from the lowest answer to the highest.',
			'A wrong pop costs three seconds and resets your combo.',
			'Clear as many complete sets as you can before the 90-second timer ends.'
		],
		controls: ['Click / tap balloons', '1 · 2 · 3 keys', 'Escape to pause'],
		metrics: [
			{ key: 'sets', label: 'Sets cleared' },
			{ key: 'bestCombo', label: 'Best combo', suffix: '×' },
			{ key: 'wrong', label: 'Wrong pops' },
			{ key: 'avgResponse', label: 'Avg response', suffix: 's' }
		]
	},
	{
		slug: 'hidden-maze',
		name: 'Hidden Maze',
		number: '03',
		tag: 'Spatial · Memory',
		tagline: 'Map it in your mind.',
		description:
			'The walls are invisible. Explore, remember, and collect every key before finding the exit. Four shuffled mazes test spatial memory and calm under uncertainty.',
		skill: 'spatial',
		skillLabel: 'Spatial memory',
		duration: '4 mazes · 6 minutes',
		difficulty: 'Progressive',
		accent: '#5eead4',
		softAccent: 'rgba(94, 234, 212, 0.11)',
		icon: 'maze',
		rules: [
			'Move with the arrow keys or by selecting an adjacent tile.',
			'The walls cannot be seen. Your explored route stays faintly marked so you can retrace it.',
			'Collect every key in the maze to unlock the exit. Touching a wall sends you back to the start.',
			'Clear all four mazes before the shared six-minute timer expires.'
		],
		controls: ['Arrow keys', 'Click adjacent tile', 'Escape to pause'],
		metrics: [
			{ key: 'mazes', label: 'Mazes cleared' },
			{ key: 'keys', label: 'Keys found' },
			{ key: 'resets', label: 'Wall resets' },
			{ key: 'timeRemaining', label: 'Time left', suffix: 's' }
		]
	}
];

export const GAME_MAP = Object.fromEntries(GAMES.map((game) => [game.slug, game])) as Record<
	GameSlug,
	GameMeta
>;

export const SKILLS: { key: SkillKey; label: string; description: string }[] = [
	{
		key: 'logic',
		label: 'Logic',
		description: 'Pattern recognition and spatial-layout reasoning under time pressure.'
	},
	{
		key: 'numerical',
		label: 'Numerical speed',
		description: 'Fast arithmetic evaluation and accurate sequencing.'
	},
	{
		key: 'spatial',
		label: 'Spatial memory',
		description: 'Working memory, orientation, and route recall without visual cues.'
	}
];

export const GAME_WEIGHTS: Record<GameSlug, number> = {
	'matrix-flow': 0.4,
	'balloon-math': 0.3,
	'hidden-maze': 0.3
};

export function isGameSlug(value: string): value is GameSlug {
	return value in GAME_MAP;
}

export function getGameMeta(slug: GameSlug): GameMeta {
	return GAME_MAP[slug];
}
