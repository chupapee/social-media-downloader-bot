import { Scenes } from 'telegraf';

import { getPage, parsePage } from '@entities/tiktok';
import { addMsgToRemoveList } from '@features/bot';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { ChatType, IContextBot } from '@shared/config';
import { calcLinkSize, retryGettingPage } from '@shared/utils';

export const tiktokScene = new Scenes.BaseScene<IContextBot>('tiktokScene');

const MAX_VIDEO_SIZE = 20; /** mbyte */
const tooLargeError = 'file size is too large';
const linkNotFoundError = 'link not found';

tiktokScene.enter((ctx) => {
	const originalLink = ctx.state.link;
	const chatType: ChatType = ctx.state.chatType;

	const handelEnter = async () => {
		onServiceInit({ ctx, socialMediaType: 'tiktok' });

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
			if (chatType === 'private') {
				const { message_id } = await ctx.reply(
					ctx.i18n.t('beforeUpload'),
					{
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
					}
				);
				addMsgToRemoveList(message_id, ctx);
			}

			const videoSize = await calcLinkSize(link.href, 'content-length');

			if (videoSize && videoSize > MAX_VIDEO_SIZE) {
				throw new Error(tooLargeError);
			}

			//** uploading to Telegram */
			await ctx.replyWithVideo(link.href, {
				caption: `<a href='${originalLink}'>${link.title}</a>`,
				parse_mode: 'HTML',
			});
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
				originalLink,
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'tiktok',
				status: 'error',
				error,
				originalLink,
			})
		);
});
