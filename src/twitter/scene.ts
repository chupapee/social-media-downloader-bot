import { Scenes } from 'telegraf';
import { IContextBot } from '../config/context.interface';
import { startInteraction, endInteraction } from '../statsDb/stats.helper';

import { retryGettingPage } from '../utils/utils';
import { getPage, parseLink } from './twitter.service';
import { isUploadAction } from './checkers';

export const TWITTER_SCENE = 'twitterScene';
export const twitterScene = new Scenes.BaseScene<IContextBot>(TWITTER_SCENE);

twitterScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const twitterLink = ctx.state.link;

		try {
			const content = await retryGettingPage(
				5,
				twitterLink,
				getPage,
				15_000
			);
			if (!content) throw new Error();

			const qualities = parseLink(content as string);
			if ('message' in ctx.update) {
				const currentId = ctx.update.message.from.id;
				const allUsersExceptCurrent =
					ctx.session.data?.filter(
						({ userId }) => userId !== currentId
					) ?? [];
				const currentUser = {
					userId: currentId,
					twLinks: [...qualities],
					twLinkOne: '',
				};
				ctx.session.data = [...allUsersExceptCurrent, currentUser];

				startInteraction(ctx.update.message.from, 'twitter');
			}
			await ctx.reply(ctx.i18n.t('chooseQuality'), {
				reply_markup: {
					inline_keyboard: qualities.map(({ quality }) => [
						{ text: quality, callback_data: `download@${quality}` },
					]),
				},
			});
		} catch (error) {
			console.log(error, 'error message');
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};

	handleEnter();
});

twitterScene.action(isUploadAction, async (ctx) => {
	const handleAction = async () => {
		await ctx.answerCbQuery();

		const currentId = ctx.update.callback_query.from.id;
		const link =
			ctx.session.data?.find((u) => u.userId === currentId)?.twLinkOne ??
			'';

		await ctx.editMessageText(ctx.i18n.t('uploadingVideo'));
		await ctx.replyWithVideo({ url: link });

		endInteraction(ctx.update.callback_query.from, 'twitter');
	};

	handleAction();
});
