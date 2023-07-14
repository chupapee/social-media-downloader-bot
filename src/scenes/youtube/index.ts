import { Scenes } from 'telegraf';

import {
	createLinksKeyboard,
	getPage,
	parsePage,
} from '../../entities/youtube';
import { onServiceFinish, onServiceInit } from '../../features/scenes';
import { IContextBot } from '../../shared/config';
import { retryGettingPage } from '../../shared/utils';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

youtubeScene.enter((ctx) => {
	const handleEnter = async () => {
		const originalLink = ctx.state.link;
		const isShorts = originalLink.includes('shorts');
		onServiceInit({ ctx, originalLink, socialMediaType: 'you' });

		try {
			const page = await retryGettingPage(
				3,
				originalLink,
				getPage,
				20_000
			);

			if (!page) throw new Error('parsing page failed');
			const links = parsePage(page);

			const smallestLink = links.reduce((smallest, current) => {
				return smallest.quality! < current.quality!
					? smallest
					: current;
			});

			const linksKeyboard = createLinksKeyboard(links);

			if (isShorts) {
				await ctx.replyWithVideo(
					{ url: smallestLink.href! },
					{
						caption: smallestLink.descr ?? ctx.i18n.t('savedByBot'),
						reply_markup: { inline_keyboard: linksKeyboard },
					}
				);
			} else {
				await ctx.reply(
					smallestLink.descr ?? ctx.i18n.t('savedByBot'),
					{ reply_markup: { inline_keyboard: linksKeyboard } }
				);
			}
		} catch (error) {
			console.error(error);
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			if (error instanceof Error) throw new Error(error.message);
		}
	};
	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'you',
				status: 'success',
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'you',
				status: 'error',
				error,
			})
		);
});
