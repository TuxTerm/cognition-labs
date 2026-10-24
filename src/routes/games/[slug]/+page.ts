import { error } from '@sveltejs/kit';
import { GAMES, isGameSlug } from '#lib/data/games';
import type { PageLoad } from './$types';

export const entries = () => GAMES.map((game) => ({ slug: game.slug }));

export const load: PageLoad = ({ params }) => {
	if (!isGameSlug(params.slug)) {
		error(404, 'Drill not found');
	}
	return { slug: params.slug };
};
