import { createEffect } from 'effector';
import { bot } from 'main';
import { splitArray, timeout } from 'shared/utils';

import { MAX_FILE_LIMIT } from '../lib/consts';
import { InstagramLink } from '../model/types';

interface SendFewVideosArgs {
	chatId: string;
	instagramLinks: InstagramLink[];
	link: string;
}

export const sendFewVideos = createEffect(
	async ({ chatId, instagramLinks, link }: SendFewVideosArgs) => {
		const limitedLinks = splitArray(instagramLinks, MAX_FILE_LIMIT);

		for (const list of limitedLinks) {
			bot.telegram.sendMediaGroup(
				chatId,
				list.map(({ href, type, source }, i) => {
					const filename = `${source}.${type === 'video' ? 'mp4' : 'jpg'}`;
					/** add caption only to the first link */
					if (i === 0) {
						return {
							type,
							media: {
								url: href,
								filename,
							},
							caption: `<a href='${link}'>${instagramLinks[0].source}</a>`,
							parse_mode: 'HTML',
						};
					}
					return {
						type,
						media: { url: href, filename },
					};
				})
			);

			await timeout(2000);
		}
	}
);
