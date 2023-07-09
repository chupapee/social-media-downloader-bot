import { Scenes } from 'telegraf';

import { IContextBot } from '../config';
import { sendToAuthor } from '../helpers';
import { statsModel } from '../statsDb';
import { getPage, parseJson } from './twitter.service';

const ACTION_ID = 'action';

const TWITTER_SCENE = 'twitterScene';
export const twitterScene = new Scenes.BaseScene<IContextBot>(TWITTER_SCENE);

twitterScene.enter(async (ctx) => {
	const handleEnter = async () => {
		const originalLink: string = ctx.state.link;

		try {
			const content = await getPage(originalLink);
			if (!content?.data) throw new Error("page doesn't parsed");

			const { fullCaption, actionsBtn, mediaFiles } = parseJson(
				content,
				originalLink
			);

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

			const actionsText = actionsBtn.map((act) => act).join(' | ');
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

			await ctx.reply(`${fullCaption}\n\n${actionsText}`, {
				parse_mode: 'HTML',
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

twitterScene.action(ACTION_ID, async (ctx) => {
	await ctx.answerCbQuery();
});
