import { InlineKeyboardButton } from 'typegram';
import { videoFormat } from 'ytdl-core';

import { uniqueList } from '@shared/utils';

export const createLinksKeyboard = (links: videoFormat[]) => {
	const uniqueLinks = uniqueList(links, 'qualityLabel' ?? 'quality');
	return uniqueLinks.reduce(
		(
			acc: InlineKeyboardButton[][],
			{ url, quality, qualityLabel },
			index
		) => {
			const btn = { text: `🔗 ${qualityLabel ?? quality}`, url };
			/** skip lowest quality */
			if (quality === 'tiny') return acc;
			if (index % 3 === 0) {
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
