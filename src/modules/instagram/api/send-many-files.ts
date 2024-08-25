import { createEffect } from 'effector';
import { bot } from 'main';
import { bytesToMegaBytes, downloadLink, splitArray } from 'shared/utils';
import { MediaGroup } from 'telegraf/typings/telegram-types';

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
			const uploadableList = [];

			for (const media of list) {
				const filename = `${media.source}.${
					media.type === 'video' ? 'mp4' : 'jpg'
				}`;

				if (media.type === 'photo') {
					uploadableList.push({
						type: media.type,
						media: {
							url: media.href,
							filename,
						},
						caption: `<a href='${link}'>${media.source}</a>`,
						parse_mode: 'HTML',
					});
					continue;
				}

				const videoBuffer = await downloadLink(media.href);
				const mediaData =
					videoBuffer && bytesToMegaBytes(videoBuffer.byteLength) < 50
						? {
								source: videoBuffer,
								filename,
						  }
						: { url: media.href, filename };

				if (videoBuffer) {
					uploadableList.push({
						type: media.type,
						media: mediaData,
						caption: `<a href='${link}'>${media.source}</a>`,
						parse_mode: 'HTML',
					});
				}
			}

			bot.telegram.sendMediaGroup(chatId, uploadableList as MediaGroup);
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
