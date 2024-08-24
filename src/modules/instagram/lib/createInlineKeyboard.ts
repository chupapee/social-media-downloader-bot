import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { InstagramLink } from '../model/types';

export const createInlineKeyboard = (links: InstagramLink[]) => {
	return links.reduce(
		(acc: InlineKeyboardButton[][], { href, type }, index) => {
			const btn = { text: `${index + 4} ${type}`, url: href };
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
