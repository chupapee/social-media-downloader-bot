import { Scenes } from 'telegraf';

import { getPage, parsePage } from '../../entities/tiktok';
import { onServiceFinish, onServiceInit } from '../../features/scenes';
import { IContextBot } from '../../shared/config';
import { calcLinkSize, retryGettingPage } from '../../shared/utils';

export const tiktokScene = new Scenes.BaseScene<IContextBot>('tiktokScene');

const MAX_VIDEO_SIZE = 20; /** mbyte */
const tooLargeError = 'file size is too large';
const linkNotFoundError = 'link not found';

tiktokScene.enter((ctx) => {
	const handelEnter = async () => {
		const originalLink = ctx.state.link;
		onServiceInit({ ctx, originalLink, socialMediaType: 'tiktok' });

		try {
			const page = await retryGettingPage(
				3,
				originalLink,
				getPage,
				15_000
			);
			if (!page) throw new Error(linkNotFoundError);
			const link = parsePage(page);
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

			const videoSize = await calcLinkSize(link.href, 'content-length');

			if (videoSize && videoSize > MAX_VIDEO_SIZE) {
				throw new Error(tooLargeError);
			}

			//** uploading to Telegram */
			await ctx.replyWithVideo(link.href, { caption: link.title });
		} catch (error) {
			if (error instanceof Error) {
				switch (error.message) {
					case tooLargeError:
						await ctx.reply(ctx.i18n.t('tooLargeSize'));
						break;
					case linkNotFoundError:
						await ctx.reply(ctx.i18n.t('incorrectLink'));
						break;
					default:
						console.error(error, 'ERROR');
						await ctx.reply(ctx.i18n.t('smthWentWrong'));
				}
				throw new Error(error.message);
			}
		}
	};
	handelEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'tiktok',
				status: 'success',
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'tiktok',
				status: 'error',
				error,
			})
		);
});
