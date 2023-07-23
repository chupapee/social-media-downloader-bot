import { Scenes } from 'telegraf';
import ytdl from 'ytdl-core';

import {
	createLinksKeyboard,
	createStatsKeyboard,
	getFormatToUpload,
} from '@entities/youtube';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

youtubeScene.enter((ctx) => {
	const handleEnter = async () => {
		const originalLink: string = ctx.state.link;
		onServiceInit({ ctx, originalLink, socialMediaType: 'you' });

		try {
			const { videoDetails, formats } = await ytdl.getBasicInfo(
				originalLink
			);

			const {
				author,
				ownerChannelName,

				title,
				description,

				likes,
				viewCount,
				dislikes,

				lengthSeconds,
			} = videoDetails;

			const formatsKeyboardButtons = createLinksKeyboard(formats);

			await ctx.reply(ctx.i18n.t('beforeUpload'), {
				reply_markup: {
					inline_keyboard: formatsKeyboardButtons,
				},
			});

			const statsKeyboard = createStatsKeyboard({
				likes,
				dislikes,
				viewCount,
			});

			const formatToUpload = await getFormatToUpload(
				formats,
				lengthSeconds
			);

			if (formatToUpload) {
				const caption = `${
					title ?? description ?? ctx.i18n.t('savedByBot')
				}\n\n<a href='${originalLink}'>👤 ${
					author.name ?? ownerChannelName ?? author.user
				}</a>`;
				const filename = `${title ?? author.name ?? author.user}.mp4`;

				await ctx.replyWithVideo(
					{
						url: formatToUpload.url,
						filename,
					},
					{
						caption,
						parse_mode: 'HTML',
						reply_markup: { inline_keyboard: statsKeyboard },
					}
				);
				return;
			}
			await ctx.reply(ctx.i18n.t('tooLargeSize'));
		} catch (error) {
			console.error('error');
			if (error instanceof Error) {
				if (error.message.includes('410')) {
					ctx.reply(ctx.i18n.t('regionError'));
				}
				throw new TypeError(error.message);
			}
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};
	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'you',
				status: 'success',
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'you',
				status: 'error',
				error,
			})
		);
});
