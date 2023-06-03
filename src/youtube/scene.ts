import { Scenes } from 'telegraf';
import { IContextBot } from '../config/context.interface';

import { retryGettingPage } from '../utils/utils';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';

import { getPage, parseLink } from './you.service';
import { isUploadAction } from './checkers';

export const YOU_SCENE = 'you_scene';
export const youScene = new Scenes.BaseScene<IContextBot>(YOU_SCENE);

const ErrMsg = '❌ Что-то пошло не так, попробуйте заново.';

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
					await ctx.reply('🎥 Выберите разрешение:', {
						reply_markup: {
							inline_keyboard: links.map(({ title }) => [
								{
									text: title!,
									callback_data: `download@${title}`,
								},
							]),
						},
					});
				} else throw new Error(ErrMsg);
			} else throw new Error(ErrMsg);
		} catch (error) {
			console.log(error);
			await ctx.reply(ErrMsg);
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
				await ctx.editMessageText('⏳ Загружаем видео в телеграм...');
				await ctx.replyWithVideo(
					{ url: link.href! },
					{
						caption:
							link.descr ??
							'Saved by: @insta_twitter_youtube_bot',
					}
				);
			} else {
				await ctx.editMessageText(
					`Перейдите по ссылке чтобы скачать видео:\n[${
						link.quality + 'p: ' + link.descr
					}](${link.href})`,
					{ parse_mode: 'Markdown' }
				);
			}
		} else {
			await ctx.reply(ErrMsg);
		}

		endInteraction(ctx.update.callback_query.from, 'you');
	};

	handleAction();
});
