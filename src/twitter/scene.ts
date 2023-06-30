import { Scenes } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

import { IContextBot } from '../config/context.interface';
import { startInteraction, endInteraction } from '../statsDb/stats.helper';

import { retryGettingPage } from '../utils/utils';
import { getSmallestLink } from './helpers';
import { getPage, parseLink } from './twitter.service';

export const TWITTER_SCENE = 'twitterScene';
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
			if (!content) throw new Error();

			const links = parseLink(content as string);
			if ('message' in ctx.update) {
				const currentId = ctx.update.message.from.id;
				const allUsersExceptCurrent =
					ctx.session.data?.filter(
						({ userId }) => userId !== currentId
					) ?? [];
				const currentUser = {
					userId: currentId,
					twLinks: [...links],
					twLinkOne: '',
					twOriginal: originalLink,
				};
				ctx.session.data = [...allUsersExceptCurrent, currentUser];

				startInteraction(ctx.update.message.from, 'twitter');
			}

			const smallestLink = getSmallestLink(links);

			const buttons = links.reduce(
				(acc: InlineKeyboardButton[][], { href, quality }, index) => {
					const btn = { text: `🔗 ${quality}`, url: href };
					if (quality === smallestLink.quality) return acc; // skip smallest link

					if (index % 2 === 0) {
						acc.push([btn]);
					} else {
						acc[acc.length - 1].push(btn);
					}
					return acc;
				},
				[]
			);

			await ctx.replyWithVideo(
				{ url: smallestLink.href },
				{
					reply_markup: { inline_keyboard: buttons },
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
