import { createEffect } from 'effector';
import { bot } from 'main';
import {
	bytesToMegaBytes,
	downloadLink,
	splitArray,
	timeout,
} from 'shared/utils';
import { MediaGroup } from 'telegraf/typings/telegram-types';

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

			await timeout(2000);
		}
	}
);
