import { createEffect } from 'effector';
import { bot } from 'main';
import { splitArray } from 'shared/utils';

import { MAX_FILE_LIMIT, MAX_VIDEOS_LIMIT } from '../lib/consts';
import { createInlineKeyboard } from '../lib/createInlineKeyboard';
import { InstagramLink } from '../model/types';

interface SendManyFileArgs {
	chatId: string;
	instagramLinks: InstagramLink[];
	link: string;
}

export const sendManyFiles = createEffect(
	async ({ chatId, instagramLinks, link }: SendManyFileArgs) => {
		const photos = instagramLinks.filter(({ type }) => type === 'photo');
		const videos = instagramLinks.filter(({ type }) => type === 'video');

		/** first send all photos and only 5 videos */
		const limitedVideosList = [...photos, ...videos.slice(0, MAX_VIDEOS_LIMIT)];

		const limitedLinks = splitArray(limitedVideosList, MAX_FILE_LIMIT);
		for (const list of limitedLinks) {
			await bot.telegram.sendMediaGroup(
				chatId,
				list.map(({ type, href, source }) => {
					return {
						type,
						media: {
							url: href,
							filename: `${source}.${type === 'video' ? 'mp4' : 'jpg'}`,
						},
						parse_mode: 'HTML',
					};
				})
			);
		}

		/** send other videos links */
		await bot.telegram.sendMessage(
			chatId,
			`<a href='${link}'>🎥 Other videos from ${instagramLinks[0].source}:</a>`,
			{
				reply_markup: {
					inline_keyboard: createInlineKeyboard(videos.slice(MAX_VIDEOS_LIMIT)),
				},
				parse_mode: 'HTML',
			}
		);
	}
);
