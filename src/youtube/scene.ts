import { Scenes } from 'telegraf';

import { IContextBot } from '../config/context.interface';
import { createInlineKeyboard } from '../helpers';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';
import { retryGettingPage } from '../utils/utils';
import { getPage, parseLink } from './you.service';

const YOU_SCENE = 'youScene';
export const youScene = new Scenes.BaseScene<IContextBot>(YOU_SCENE);

youScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const pageLink = ctx.state.link;
		const isShorts = pageLink.includes('shorts');

		try {
			const page = await retryGettingPage(3, pageLink, getPage, 20_000);

			if ('message' in ctx.update && page) {
				const links = parseLink(page);
				if (links.length > 0) {
					startInteraction(ctx.update.message.from, 'you');

					const smallestLink = links.reduce((smallest, current) => {
						return smallest.quality! < current.quality!
							? smallest
							: current;
					});

					const inline_keyboard = createInlineKeyboard(links);

					if (isShorts) {
						await ctx.replyWithVideo(
							{ url: smallestLink.href! },
							{
								caption:
									smallestLink.descr ??
									ctx.i18n.t('savedByBot'),
								reply_markup: { inline_keyboard },
							}
						);
					} else {
						await ctx.reply(
							smallestLink.descr ?? ctx.i18n.t('savedByBot'),
							{ reply_markup: { inline_keyboard } }
						);
					}

					if ('message' in ctx.update) {
						endInteraction(ctx.update.message.from, 'you');
					}
				} else throw new Error('smthWentWrong');
			} else throw new Error('smthWentWrong');
		} catch (error) {
			console.log(error);
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};
	handleEnter();
});
