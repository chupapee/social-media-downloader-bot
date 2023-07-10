import { InlineKeyboardButton } from 'typegram';

import { InstagramLink } from '../model';

export const createInlineKeyboard = (links: InstagramLink[]) => {
	return links.reduce(
		(acc: InlineKeyboardButton[][], { href, type }, index) => {
			const btn = { text: `${index + 1} ${type}`, url: href };
			if (index % 3 === 0) {
				acc.push([btn]);
			} else {
				acc[acc.length - 1].push(btn);
			}
			return acc;
		},
		[]
	);
};
