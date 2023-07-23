import { Scenes } from 'telegraf';
import ytdl from 'ytdl-core';

import {
	createLinksKeyboard,
	createStatsKeyboard,
	getAllowedFormats,
} from '@entities/youtube';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

const LONG_VIDEO_DURATION = 25; // minutes;

const calcIsVideoLong = (sec: string) => {
	const mins = Number((Number(sec) / 60).toFixed(1));
	return mins >= LONG_VIDEO_DURATION;
};

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

			let formatsKeyboardText = title;
			const formatsKeyboardButtons = createLinksKeyboard(formats);
			const isLongVideo = calcIsVideoLong(lengthSeconds);

			const { links: allowedLinks, highestQualityLink } =
				await getAllowedFormats(formats, isLongVideo);
			const statsKeyboard = createStatsKeyboard({
				likes,
				dislikes,
				viewCount,
			});

			if (allowedLinks.length > 0) {
				formatsKeyboardText = ctx.i18n.t('availableFormats');
				const caption = `${
					title ?? description ?? ctx.i18n.t('savedByBot')
				}\n\n<a href='${originalLink}'>👤 ${
					author.name ?? ownerChannelName ?? author.user
				}</a>`;
				const filename = `${title ?? author.name ?? author.user}.mp4`;
				await ctx.replyWithVideo(
					{
						url: highestQualityLink!.url,
						filename,
					},
					{
						caption,
						parse_mode: 'HTML',
						reply_markup: { inline_keyboard: statsKeyboard },
					}
				);
			}

			await ctx.reply(formatsKeyboardText, {
				reply_markup: {
					inline_keyboard: formatsKeyboardButtons,
				},
			});
		} catch (error) {
			console.error(error);
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
