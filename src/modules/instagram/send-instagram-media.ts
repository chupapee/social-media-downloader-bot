import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';

import { getPage } from './api/instagramApi';
import { sendFewVideos } from './api/send-few-videos';
import { sendManyFiles } from './api/send-many-files';
import { sendSingleFile } from './api/send-single-file';
import { MAX_VIDEOS_LIMIT } from './lib/consts';
import { parsePage } from './model/parsePage';

export const sendInstagramMedia = createEffect(
	async ({ chatId, link, ...others }: MessageData) => {
		notifyAdmin({
			messageData: { chatId, link, ...others },
			baseInfo: `source type: ${others.linkSource}`,
			status: 'start',
		});

		const isReels = link.includes('reel');

		try {
			const page = await getPage(link);
			const instagramLinks = parsePage(page);

			const videos = instagramLinks.filter(({ type }) => type === 'video');

			if (isReels || instagramLinks.length === 1) {
				await sendSingleFile({
					chatId,
					link,
					instagramLinkData: instagramLinks[0],
				});
				return;
			}

			/** max 5 videos at once
			 * and any count of photos
			 */
			if (videos.length <= MAX_VIDEOS_LIMIT) {
				await sendFewVideos({ chatId, instagramLinks, link });
				return;
			}

			/**
			 * MORE than 5 videos
			 * and any count of photos
			 * */
			await sendManyFiles({ chatId, instagramLinks, link });
		} catch (error) {
			await bot.telegram.sendMessage(
				chatId,
				'❌ Oops, something went wrong. Please try again.'
			);
			throw new Error(error as any);

			// if (typeof error === 'string') {
			// 	console.log('here');

			// 	throw new Error(error);
			// }
			// if (error instanceof Error) throw new Error(error.message);
		}
	}
);
