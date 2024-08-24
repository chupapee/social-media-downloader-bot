import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';
import { ScrapingError, UnknownError, WrongLinkError } from 'shared/api';

import {
	getPage,
	TweetEmptyError,
	TweetUnavailableError,
} from './api/twitterApi';
import { createActionsKeyboard } from './lib/createActionsKeyboard';
import { processTweetJson } from './model';

export const sendTwitterMedia = createEffect<MessageData, void, UnknownError>(
	async ({ chatId, link, ...others }) => {
		try {
			const content = await getPage(link);

			if (!content) {
				throw new WrongLinkError('❌ Failed to parse the link(');
			}

			const { fullCaption, actionsBtn, mediaFiles } = await processTweetJson(
				content,
				link
			);

			const actionsKeyboard = createActionsKeyboard(actionsBtn);

			if (mediaFiles.length > 0) {
				await bot.telegram.sendMediaGroup(
					chatId,
					mediaFiles.map(({ href, type }, i) => {
						const filename = type === 'video' ? `${type}.mp4` : `${type}.jpg`;

						const media =
							type === 'video'
								? {
										source: href,
										filename,
								  }
								: { url: href, filename };

						if (i === 0) {
							return {
								media: media as any,
								type,
								caption: `${fullCaption}`,
								parse_mode: 'HTML',
							};
						}

						return {
							media: media as any,
							type,
						};
					})
				);
				await bot.telegram.sendMessage(chatId, '📊 | Tweet stats', {
					reply_markup: { inline_keyboard: actionsKeyboard },
				});
				return;
			}

			await bot.telegram.sendMessage(chatId, fullCaption, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: actionsKeyboard,
				},
			});
		} catch (error) {
			console.error(error, 'error message');

			if (error instanceof TweetEmptyError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link, ...others },
					status: 'error',
					errorInfo: { cause: error.message },
				});
				return;
			}
			if (error instanceof TweetUnavailableError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link, ...others },
					status: 'error',
					errorInfo: { cause: error.message },
				});
				return;
			}
			if (error instanceof WrongLinkError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link, ...others },
					status: 'error',
					errorInfo: { cause: error.message },
				});
				return;
			}

			if (error instanceof ScrapingError) {
				await bot.telegram.sendMessage(chatId, error.message);
				notifyAdmin({
					messageData: { chatId, link, ...others },
					status: 'error',
					errorInfo: { cause: error.error },
				});
				return;
			}

			throw new UnknownError(error);
		}
	}
);
