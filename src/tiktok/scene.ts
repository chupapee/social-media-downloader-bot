import { Scenes } from 'telegraf';

import { IContextBot } from '../config';
import { sendToAuthor } from '../helpers';
import { statsModel } from '../statsDb';
import { detectLinkSize, retryGettingPage } from '../utils';
import { getPage, parseLink } from './tiktok.service';

const TIKTOK_SCENE = 'tiktokScene';
export const tiktokScene = new Scenes.BaseScene<IContextBot>(TIKTOK_SCENE);

const MAX_VIDEO_SIZE = 20; /** mbyte */
const tooLargeError = 'file size is too large';
const linkNotFoundError = 'link not found';

tiktokScene.enter((ctx) => {
	const handelEnter = async () => {
		const originalLink = ctx.state.link;

		try {
			if ('message' in ctx.update) {
				sendToAuthor(
					{
						author: ctx.update.message.from,
						link: originalLink,
						additional: 'tiktok link handling started! 🚀',
					},
					'full'
				);
				statsModel.startInteraction(ctx.update.message.from, 'tiktok');
			}

			const page = await retryGettingPage(
				3,
				originalLink,
				getPage,
				15_000
			);
			if (!page) throw new Error(linkNotFoundError);
			const link = parseLink(page);
			if (!link.href) throw new Error(linkNotFoundError);

			//** link button before upload to Telegram */
			await ctx.reply(ctx.i18n.t('beforeUpload'), {
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: `🔗 ${link.title} 🎥`,
								url: link.href,
							},
						],
					],
				},
			});

			const videoSize = await detectLinkSize(link.href, 'content-length');

			if ('message' in ctx.update) {
				sendToAuthor(
					{
						additional: `🎥 video size: ${videoSize}mb.`,
					},
					'short'
				);
				statsModel.endInteraction(ctx.update.message.from, 'tiktok');
				sendToAuthor(
					{ additional: 'tiktok link successfully handled! ✅' },
					'short'
				);
			}

			if (videoSize && videoSize > MAX_VIDEO_SIZE) throw new Error(tooLargeError);


			//** uploading to Telegram */
			await ctx.replyWithVideo(link.href, { caption: link.title });
		} catch (error) {
			if (error instanceof Error) {
				sendToAuthor({ additional: error.message }, 'short');
				switch (error.message) {
					case tooLargeError:
						await ctx.reply(ctx.i18n.t('tooLargeSize'));
						break;
					case linkNotFoundError:
						await ctx.reply(ctx.i18n.t('incorrectLink'));
						break;
					default:
						console.log(error, 'ERROR');
						await ctx.reply(ctx.i18n.t('smthWentWrong'));
				}
			}
		}
	};
	handelEnter();
});
