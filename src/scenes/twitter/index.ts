import { Scenes } from 'telegraf';

import {
	createActionsKeyboard,
	getPage,
	processTweetJson,
} from '@entities/twitter';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';

export const twitterScene = new Scenes.BaseScene<IContextBot>('twitterScene');

twitterScene.enter(async (ctx) => {
	const originalLink: string = ctx.state.link;
	const handleEnter = async () => {
		onServiceInit({ ctx, socialMediaType: 'twitter' });

		try {
			const content = await getPage(originalLink);

			if (!content || !content.data)
				throw new Error("page doesn't parsed");

			const { fullCaption, actionsBtn, mediaFiles } =
				await processTweetJson(content, originalLink);

			const actionsKeyboard = createActionsKeyboard(actionsBtn);

			if (mediaFiles.length > 0) {
				await ctx.replyWithMediaGroup(
					mediaFiles.map(({ href, type }, i) => {
						const filename =
							type === 'video' ? `${type}.mp4` : `${type}.jpg`;

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
				await ctx.reply(ctx.i18n.t('tweetStats'), {
					reply_markup: { inline_keyboard: actionsKeyboard },
				});
				return;
			}

			await ctx.reply(fullCaption, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: actionsKeyboard,
				},
			});
		} catch (error) {
			console.error(error, 'error message');
			if (error instanceof Error) {
				if (error.message === 'TweetUnavailable') {
					await ctx.reply(ctx.i18n.t('TweetUnavailable'));
					throw new Error(error.message);
				}
				await ctx.reply(ctx.i18n.t('smthWentWrong'));
				throw new Error(error.message);
			}
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			throw new Error(`${JSON.stringify(error)}, 'unhandled error'`);
		}
	};

	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'twitter',
				status: 'success',
				originalLink,
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'twitter',
				status: 'error',
				error,
				originalLink,
			})
		);
});
