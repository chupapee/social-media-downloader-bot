import { Scenes } from 'telegraf';

import { IContextBot } from '../config';
import { createInlineKeyboard, sendToAuthor } from '../helpers';
import { statsModel } from '../statsDb';
import { retryGettingPage } from '../utils';
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
				statsModel.startInteraction(ctx.update.message.from, 'twitter');
				sendToAuthor(
					{
						author: ctx.update.message.from,
						link: originalLink,
						additional: `Twitter link handling started! 🚀`,
					},
					'full'
				);
			}

			const smallestLink = getSmallestLink(links);
			const inline_keyboard = createInlineKeyboard(links, smallestLink);

			await ctx.replyWithVideo(smallestLink.href, {
				reply_markup: { inline_keyboard },
			});

			if ('message' in ctx.update) {
				statsModel.endInteraction(ctx.update.message.from, 'twitter');
				sendToAuthor(
					{
						additional: `Twitter link successfully handled! ✅`,
					},
					'short'
				);
			}
		} catch (error) {
			console.log(error, 'error message');
			await ctx.reply(ctx.i18n.t('smthWentWrong'));

			if (error instanceof Error && 'message' in ctx.update) {
				sendToAuthor(
					{
						additional: `Twitter link handling failed! ❌\nError: ${error.message}`,
					},
					'short'
				);
			}
		}
	};

	handleEnter();
});
