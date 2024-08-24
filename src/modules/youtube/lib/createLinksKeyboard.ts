import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { YouTubeLink } from '../model/types';

const sortLinks = (links: YouTubeLink[]) => {
	return links.sort((a, b) => {
		return b.quality.localeCompare(a.quality, undefined, {
			numeric: true,
		});
	});
};

export const createLinksKeyboard = (links: YouTubeLink[]) => {
	const sortedLinks = sortLinks(links);
	return sortedLinks.reduce(
		(acc: InlineKeyboardButton[][], { href, quality }, index) => {
			const btn = { text: `🔗 ${quality}`, url: href };
			if (index % 2 === 0) {
				acc.push([btn]);
			} else {
				const lastItem = acc[acc.length - 1];
				if (lastItem) lastItem.push(btn);
				else acc.push([btn]);
			}
			return acc;
		},
		[]
	);
};
