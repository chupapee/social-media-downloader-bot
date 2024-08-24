import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';
import { calcLinkSize, retryGettingPage } from 'shared/utils';

import { getPage } from './api/tiktopApi';
import { parsePage } from './model/parsePage';

const MAX_VIDEO_SIZE = 20; /** mbyte */
const tooLargeError = 'file size is too large';
const linkNotFoundError = 'link not found';

export const sendTiktokMedia = createEffect(
	async ({ chatId, link: originalLink, ...others }: MessageData) => {
		notifyAdmin({
			messageData: { chatId, link: originalLink, ...others },
			baseInfo: `source type: ${others.linkSource}`,
			status: 'start',
		});

		try {
			const page = await retryGettingPage(3, originalLink, getPage, 15_000);
			if (!page) throw new Error(linkNotFoundError);
			const link = parsePage(page);
			if (!link.href) throw new Error(linkNotFoundError);

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
				throw new Error(tooLargeError);
			}

			//** uploading to Telegram */
			await bot.telegram.sendVideo(
				chatId,
				{ url: link.href },
				{
					caption: `<a href='${link}'>${link.title}</a>`,
					parse_mode: 'HTML',
				}
			);
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case tooLargeError:
						await bot.telegram.sendMessage(
							chatId,
							'⚠️ The file size is too large for uploading to Telegram\nPlease use the links above 👆\njust click on the button with the desired resolution)'
						);
						break;
					case linkNotFoundError:
						await bot.telegram.sendMessage(
							chatId,
							'❌ Failed to parse the link(\nSomething might be wrong with the file...'
						);
						break;
					default:
						console.error(error, 'ERROR');
						await bot.telegram.sendMessage(
							chatId,
							'❌ Oops, something went wrong. Please try again.'
						);
						throw new Error(error.message);
				}
				throw new Error(error.message);
			}
		}
	}
);
