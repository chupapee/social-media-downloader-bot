import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';
import { retryGettingPage, timeout } from 'shared/utils';
import ytdl from 'ytdl-core';

import { getPage } from './api/youtubeApi';
import { createLinksKeyboard } from './lib/createLinksKeyboard';
import { createStatsKeyboard } from './lib/createStatsKeyboard';
import { parsePage } from './model/parsePage';
import { YouTubeLink } from './model/types';

const MAX_ALLOWED_SIZE = 50; // mb
const RETRIES_COUNT = 2;
const MAX_TIMEOUT = 25_000;

export const sendYoutubeMedia = createEffect(
	async ({ chatId, link: originalLink, ...others }: MessageData) => {
		notifyAdmin({
			messageData: { chatId, link: originalLink, ...others },
			baseInfo: `source type: ${others.linkSource}`,
			status: 'start',
		});

		try {
			const page = await retryGettingPage(
				RETRIES_COUNT,
				originalLink,
				getPage,
				MAX_TIMEOUT
			);

			if (!page) throw new Error('smthWentWrong');

			const links = await parsePage(page);
			const linksKeyboard = createLinksKeyboard(links);

			const uploadableLinks = filterUploadableLinks(links);
			if (uploadableLinks.length > 0) {
				await bot.telegram.sendMessage(
					chatId,
					"📥 While we're uploading the video to Telegram, you can use the following links for a quick download 👇",
					{
						parse_mode: 'HTML',
						reply_markup: { inline_keyboard: linksKeyboard },
					}
				);
			}

			const videoInfo = await Promise.race([
				ytdl.getInfo(originalLink),
				timeout(20_000),
			]).catch(() => {});

			let caption = links[0].descr ?? '';
			let statsKeyboard = null;
			let filename = links[0].title;
			if (videoInfo) {
				const { title, likes, viewCount, dislikes, author } =
					videoInfo.videoDetails;
				caption = `${title}\n\n<a href='${originalLink}'>👤 ${
					author.name ?? author.user
				}</a>`;
				filename = `${title}.mp4`;
				statsKeyboard = createStatsKeyboard({
					likes,
					dislikes,
					viewCount,
				});
			}

			if (uploadableLinks.length > 0) {
				const link = uploadableLinks[0];

				const replyOptions = statsKeyboard
					? {
							caption,
							reply_markup: {
								inline_keyboard: statsKeyboard,
							},
							parse_mode: 'HTML',
					  }
					: { caption };

				await bot.telegram.sendVideo(
					chatId,
					{ url: link.href, filename },
					replyOptions as any
				);
				return;
			}

			await bot.telegram.sendMessage(chatId, caption, {
				parse_mode: 'HTML',
				reply_markup: { inline_keyboard: linksKeyboard },
			});

			throw new Error('tooLargeSize');
		} catch (error) {
			console.error(error);
			if (error instanceof Error) {
				if (error.message.includes('410')) {
					bot.telegram.sendMessage(
						chatId,
						// bot.telegram.i18n.t('regionError')
						'🔒 Link is unavailable for download'
					);
					throw new Error(error.message);
				}
				if (error.message === 'tooLargeSize') {
					bot.telegram.sendMessage(
						chatId,
						'⚠️ The file size is too large for uploading to Telegram\nPlease use the links above 👆\njust click on the button with the desired resolution)'
					);
					throw new Error(error.message);
				}
				await bot.telegram.sendMessage(
					chatId,
					'❌ Oops, something went wrong. Please try again.'
				);
				throw new Error(error.message);
			}
			await bot.telegram.sendMessage(
				chatId,
				'❌ Oops, something went wrong. Please try again.'
			);
			throw new Error('smthWentWrong');
		}
	}
);

function filterUploadableLinks(links: YouTubeLink[]) {
	return links.filter(({ size }) => size && size <= MAX_ALLOWED_SIZE);
}
