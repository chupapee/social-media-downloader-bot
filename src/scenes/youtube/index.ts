import { Scenes } from 'telegraf';

import { createLinksKeyboard, getPage, parsePage } from '@entities/youtube';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';
import { retryGettingPage } from '@shared/utils';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

const MAX_ALLOWED_MEDIA_SIZE = 50; // mb

youtubeScene.enter((ctx) => {
	const handleEnter = async () => {
		const originalLink = ctx.state.link;
		onServiceInit({ ctx, originalLink, socialMediaType: 'you' });

		try {
			const page = await retryGettingPage(
				3,
				originalLink,
				getPage,
				20_000
			);

			if (!page) throw new Error('parsing page failed');
			const links = await parsePage(page);

			const allowedToUploadLinks = links.filter(
				({ size }) => size && size <= MAX_ALLOWED_MEDIA_SIZE
			);

			if (allowedToUploadLinks.length > 0) {
				const link = allowedToUploadLinks[0];
				await ctx.replyWithVideo(
					{ url: link.href },
					{
						caption: `<a href='${originalLink}'>${
							link.descr ?? ctx.i18n.t('savedByBot')
						}</a>`,
						parse_mode: 'HTML',
					}
				);
				return;
			}

			const linksKeyboard = createLinksKeyboard(links);
			const link = links[0];

			await ctx.reply(
				`<a href='${originalLink}'>${
					link.descr ?? ctx.i18n.t('savedByBot')
				}</a>`,
				{
					parse_mode: 'HTML',
					reply_markup: { inline_keyboard: linksKeyboard },
				}
			);
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
