import { InlineKeyboardButton } from 'typegram';

import { YouTubeLink } from '../model';

export const createLinksKeyboard = (
	links: YouTubeLink[],
	smallestLink?: YouTubeLink
) => {
	return links.reduce(
		(acc: InlineKeyboardButton[][], { href, quality }, index) => {
			const btn = { text: `🔗 ${quality}`, url: href };
			if (smallestLink?.quality && quality === smallestLink.quality) return acc;
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
