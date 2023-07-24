import { Scenes } from 'telegraf';
import ytdl from 'ytdl-core';

import { onServiceFinish, onServiceInit } from '@features/scenes';
import { scrapeAndSend } from '@features/youtube';
import { IContextBot } from '@shared/config';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

youtubeScene.enter((ctx) => {
	const originalLink: string = ctx.state.link;
	const handleEnter = async () => {
		onServiceInit({ ctx, socialMediaType: 'youtube' });

		try {
			const { videoDetails } = await ytdl.getInfo(originalLink);
			await scrapeAndSend({
				ctx,
				originalLink,
				videoDetails,
			});
		} catch (error) {
			console.error(error);
			if (error instanceof Error) {
				if (error.message.includes('410')) {
					ctx.reply(ctx.i18n.t('regionError'));
					throw new TypeError(error.message);
				}
				if (error.message === 'tooLargeSize') {
					ctx.reply(ctx.i18n.t('tooLargeSize'));
					throw new TypeError(error.message);
				}
				await ctx.reply(ctx.i18n.t('smthWentWrong'));
				throw new TypeError(error.message);
			}
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			throw new Error('smthWentWrong');
		}
	};
	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'youtube',
				status: 'success',
				originalLink,
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'youtube',
				status: 'error',
				error,
				originalLink,
			})
		);
});
