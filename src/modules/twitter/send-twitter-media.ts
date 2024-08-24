import { createEffect } from 'effector';
import { bot } from 'main';
import { notifyAdmin } from 'modules/bot/controllers';
import { MessageData } from 'modules/bot/services';

import { getPage } from './api/twitterApi';
import { createActionsKeyboard } from './lib/createActionsKeyboard';
import { processTweetJson } from './model';

export const sendTwitterMedia = createEffect(
	async ({ chatId, link, ...others }: MessageData) => {
		notifyAdmin({
			messageData: { chatId, link, ...others },
			baseInfo: `source type: ${others.linkSource}`,
			status: 'start',
		});

		try {
			const content = await getPage(link);

			if (!content || !content.data) throw new Error("page doesn't parsed");

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
			if (error instanceof Error) {
				if (error.message === 'TweetUnavailable') {
					await bot.telegram.sendMessage(
						chatId,
						'🔒 Unfortunately, this tweet is protected and unavailable for viewing'
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
			throw new Error(`${JSON.stringify(error)}, 'unhandled error'`);
		}
	}
);
