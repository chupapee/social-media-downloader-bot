import { Scenes } from 'telegraf';
import { IContextBot } from '../config/context.interface';

import { retryGettingPage } from '../utils/utils';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';

import { getPage, parseLink } from './you.service';
import { isUploadAction } from './checkers';

export const YOU_SCENE = 'youScene';
export const youScene = new Scenes.BaseScene<IContextBot>(YOU_SCENE);

youScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const pageLink = ctx.state.link;

		try {
			const page = await retryGettingPage(3, pageLink, getPage, 20_000);

			if ('message' in ctx.update && page) {
				const links = parseLink(page);
				if (links.length > 0) {
					const currentId = ctx.update.message.from.id;
					const allUsersExceptCurrent =
						ctx.session.data?.filter(
							({ userId }) => userId !== currentId
						) ?? [];
					const currentUser = {
						userId: currentId,
						youLinks: links,
						youOriginal: pageLink,
					};

					ctx.session.data = [...allUsersExceptCurrent, currentUser];

					startInteraction(ctx.update.message.from, 'you');

					await ctx.reply(ctx.i18n.t('chooseQuality'), {
						reply_markup: {
							inline_keyboard: links.map(({ title }) => [
								{
									text: title!,
									callback_data: `download@${title}`,
								},
							]),
						},
					});
				} else throw new Error('smthWentWrong');
			} else throw new Error('smthWentWrong');
		} catch (error) {
			console.log(error);
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};

	handleEnter();
});

youScene.action(isUploadAction, async (ctx) => {
	const handleAction = async () => {
		await ctx.answerCbQuery();

		const currentId = ctx.update.callback_query.from.id;
		const currentUser = ctx.session.data.find(
			(u) => u.userId === currentId
		);

		const isShorts = currentUser?.youOriginal?.includes('shorts');

		if (currentUser?.youLinkOne?.href) {
			const link = currentUser.youLinkOne;
			if (isShorts) {
				await ctx.editMessageText(ctx.i18n.t('uploadingVideo'));
				await ctx.replyWithVideo(
					{ url: link.href! },
					{
						caption: link.descr ?? ctx.i18n.t('savedByBot'),
					}
				);
			} else {
				await ctx.editMessageText(
					`${ctx.i18n.t('clickToDownload')}\n[${
						link.quality + 'p: ' + link.descr
					}](${link.href})`,
					{ parse_mode: 'Markdown' }
				);
			}
		} else {
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}

		endInteraction(ctx.update.callback_query.from, 'you');
	};

	handleAction();
});
