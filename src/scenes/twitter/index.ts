import { Scenes } from 'telegraf';

import {
	createActionsKeyboard,
	getPage,
	processTweetJson,
} from '../../entities/twitter';
import { onServiceFinish, onServiceInit } from '../../features';
import { IContextBot } from '../../shared/config';

const ACTION_ID = 'action';

export const twitterScene = new Scenes.BaseScene<IContextBot>('twitterScene');

twitterScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const originalLink: string = ctx.state.link;
		onServiceInit({ ctx, originalLink, socialMediaType: 'twitter' });

		try {
			const content = await getPage(originalLink);
			if (!content?.data) throw new Error("page doesn't parsed");

			const { fullCaption, actionsBtn, mediaFiles } = processTweetJson(
				content,
				originalLink
			);

			const actionsText = actionsBtn.map((act) => act).join(' | ');
			const actionsKeyboard = createActionsKeyboard(
				actionsBtn,
				ACTION_ID
			);
			const photos = mediaFiles.filter(({ type }) => type === 'photo');
			if (photos.length > 0) {
				await ctx.replyWithMediaGroup(
					photos.map(({ href, type }, i) => {
						if (i === 0) {
							return {
								media: href,
								type,
								caption: `${fullCaption}\n\n${actionsText}`,
								parse_mode: 'HTML',
							};
						}

						return {
							media: href,
							type,
						};
					})
				);
				return;
			}

			await ctx.reply(fullCaption, {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: actionsKeyboard,
				},
			});
		} catch (error) {
			console.log(error, 'error message');
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			if (error instanceof Error) throw new Error(error.message);
		}
	};

	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'twitter',
				status: 'success',
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'twitter',
				status: 'error',
				error,
			})
		);
});

twitterScene.action(ACTION_ID, async (ctx) => {
	await ctx.answerCbQuery();
});
