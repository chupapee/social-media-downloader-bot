import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';
import { ScrapingError, TooLargeMediaSize, UnknownError } from 'shared/api';
import { retryGettingPage, timeout } from 'shared/utils';
import ytdl from 'ytdl-core';

import { getPage } from './api/youtubeApi';
import { createLinksKeyboard } from './lib/createLinksKeyboard';
import { createStatsKeyboard } from './lib/createStatsKeyboard';
import { parsePage } from './model/parsePage';
import { YouTubeLink } from './model/types';

const MAX_ALLOWED_SIZE = 48; // mb
const RETRIES_COUNT = 3;
const MAX_TIMEOUT = 15_000;

export const sendYoutubeMedia = createEffect<MessageData, void, UnknownError>(
	async ({ chatId, link: originalLink, ...others }) => {
		try {
			const page = await retryGettingPage(
				RETRIES_COUNT,
				originalLink,
				getPage,
				MAX_TIMEOUT
			);

			if (!page) {
				throw new ScrapingError(
					'🚫 Link could not be scraped, please check it or try again later',
					"page couldn't be scraped"
				);
			}

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

			throw new TooLargeMediaSize(
				'⚠️ The mediafiles size is too large for uploading to the Telegram\nPlease use the links above 👆\njust click on the button with the desired resolution)'
			);
		} catch (error) {
			console.error(error);

			if (error instanceof ScrapingError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link: originalLink, ...others },
					status: 'error',
					errorInfo: { cause: error.error },
				});
				return;
			}
			if (error instanceof TooLargeMediaSize) {
				await bot.telegram.sendMessage(chatId, error.message);
				return;
			}

			if (error instanceof Error && error.message.includes('410')) {
				await bot.telegram.sendMessage(
					chatId,
					// region-error
					'🔒 Link is unavailable for download'
				);
				notifyAdmin({
					messageData: { chatId, link: originalLink, ...others },
					status: 'error',
					errorInfo: { cause: '410: 🔒 Link is unavailable for download' },
				});
			}

			throw new UnknownError(error);
		}
	}
);

function filterUploadableLinks(links: YouTubeLink[]) {
	return links.filter(({ size }) => size && size <= MAX_ALLOWED_SIZE);
}
