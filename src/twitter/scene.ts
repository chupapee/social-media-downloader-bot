import { Scenes } from 'telegraf';

import { IContextBot } from '../config/context.interface';
import { createInlineKeyboard } from '../helpers';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';
import { retryGettingPage } from '../utils/utils';
import { getSmallestLink } from './helpers';
import { getPage, parseLink } from './twitter.service';

const TWITTER_SCENE = 'twitterScene';
export const twitterScene = new Scenes.BaseScene<IContextBot>(TWITTER_SCENE);

twitterScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const originalLink = ctx.state.link;

		try {
			const content = await retryGettingPage(
				5,
				originalLink,
				getPage,
				15_000
			);
			if (!content) throw new Error("page doesn't parsed");

			const links = parseLink(content as string);
			if ('message' in ctx.update) {
				startInteraction(ctx.update.message.from, 'twitter');
			}

			const smallestLink = getSmallestLink(links);
			const inline_keyboard = createInlineKeyboard(links, smallestLink);

			await ctx.replyWithVideo(
				{ url: smallestLink.href },
				{
					reply_markup: { inline_keyboard },
				}
			);

			if ('message' in ctx.update) {
				endInteraction(ctx.update.message.from, 'twitter');
			}
		} catch (error) {
			console.log(error, 'error message');
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};

	handleEnter();
});
