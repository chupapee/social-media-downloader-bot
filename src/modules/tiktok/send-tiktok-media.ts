import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';
import {
	ScrapingError,
	TooLargeMediaSize,
	UnknownError,
	WrongLinkError,
} from 'shared/api';
import {
	bytesToMegaBytes,
	calcLinkSize,
	downloadLink,
	retryGettingPage,
} from 'shared/utils';

import { getPage } from './api/tiktopApi';
import { parsePage } from './model/parsePage';

const MAX_VIDEO_SIZE = 48; /** megabyte */

export const sendTiktokMedia = createEffect<MessageData, void, UnknownError>(
	async ({ chatId, link: originalLink, ...others }) => {
		try {
			const page = await retryGettingPage(3, originalLink, getPage, 15_000);
			if (!page) {
				throw new WrongLinkError(
					'❌ Failed to parse the link(\nSomething might be wrong with the file...'
				);
			}

			const link = parsePage(page);
			if (!link.href) throw new WrongLinkError('❌ Failed to parse the link(');

			await bot.telegram.sendMessage(
				chatId,
				"📥 While we're uploading the video to Telegram, you can use the following links for a quick download 👇",
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: `🔗 ${link.title} 🎥`,
									url: link.href,
								},
							],
						],
					},
				}
			);

			const videoSize = await calcLinkSize(link.href, 'content-length');

			if (videoSize && videoSize > MAX_VIDEO_SIZE) {
				throw new TooLargeMediaSize(
					'⚠️ The file size is too large for uploading to Telegram\nPlease use the links above 👆\njust click on the button with the desired resolution)'
				);
			}

			const downloadedMedia = await downloadLink(link.href);
			const videoOpt =
				downloadedMedia && bytesToMegaBytes(downloadedMedia.byteLength) < 50
					? { source: downloadedMedia }
					: { url: link.href };

			//** uploading to Telegram */
			await bot.telegram.sendVideo(chatId, videoOpt, {
				caption: `<a href='${link}'>${link.title}</a>`,
				parse_mode: 'HTML',
			});
		} catch (error) {
			if (error instanceof TooLargeMediaSize) {
				await bot.telegram.sendMessage(chatId, error.message);
				return;
			}
			if (error instanceof WrongLinkError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link: originalLink, ...others },
					status: 'error',
					errorInfo: { cause: error.message },
				});
				return;
			}
			if (error instanceof ScrapingError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link: originalLink, ...others },
					status: 'error',
					errorInfo: { cause: error.error },
				});
				return;
			}

			throw new UnknownError(error);
		}
	}
);
