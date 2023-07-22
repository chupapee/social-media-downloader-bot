import { Scenes } from 'telegraf';

import {
	createActionsKeyboard,
	getPage,
	processTweetJson,
} from '@entities/twitter';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';

const ACTION_ID = 'tweetMetrics';

export const twitterScene = new Scenes.BaseScene<IContextBot>('twitterScene');

twitterScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const originalLink: string = ctx.state.link;
		onServiceInit({ ctx, originalLink, socialMediaType: 'twitter' });

		try {
			const content = await getPage(originalLink);
			if (!content?.data) throw new Error("page doesn't parsed");

			const { fullCaption, actionsBtn, mediaFiles } = processTweetJson(
				content,
				originalLink
			);

			const actionsKeyboard = createActionsKeyboard(
				actionsBtn,
				ACTION_ID
			);

			if (mediaFiles.length > 0) {
				await ctx.replyWithMediaGroup(
					mediaFiles.map(({ href, type }, i) => {
						if (i === 0) {
							return {
								media: { url: href },
								type,
								caption: `${fullCaption}`,
								parse_mode: 'HTML',
							};
						}

						return {
							media: { url: href },
							type,
						};
					})
				);
				await ctx.reply(ctx.i18n.t('tweetMetrics'), {
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
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'twitter',
				status: 'error',
				error,
			})
		);
});

twitterScene.action(ACTION_ID, async (ctx) => {
	await ctx.answerCbQuery();
});
