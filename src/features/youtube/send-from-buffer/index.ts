import { MoreVideoDetails } from 'ytdl-core';

import { createStatsKeyboard } from '@entities/youtube';
import { IContextBot } from '@shared/config';
import { bytesToMegaBytes } from '@shared/utils';

import { scrapeAndSend } from './scrape-and-send';

export const sendFromBuffer = async (
	chunks: Uint8Array[],
	videoDetails: MoreVideoDetails,
	originalLink: string,
	ctx: IContextBot
) => {
	const {
		title,
		description,

		author,
		ownerChannelName,

		likes,
		dislikes,
		viewCount,
	} = videoDetails;
	const videoBuffer = Buffer.concat(chunks);
	const statsKeyboard = createStatsKeyboard({
		likes,
		dislikes,
		viewCount,
	});
	const caption = `${
		title ?? description ?? ctx.i18n.t('savedByBot')
	}\n\n<a href='${originalLink}'>👤 ${
		author.name ?? ownerChannelName ?? author.user
	}</a>`;
	const filename = `${title ?? author.name ?? author.user}.mp4`;

	const isTooLargeSize = bytesToMegaBytes(videoBuffer.byteLength) > 48;
	if (isTooLargeSize) {
		await scrapeAndSend({
			ctx,
			originalLink,
			videoDetails: { caption, filename },
		});
	}
	await ctx.replyWithVideo(
		{
			source: videoBuffer,
			filename,
		},
		{
			caption,
			parse_mode: 'HTML',
			reply_markup: { inline_keyboard: statsKeyboard },
		}
	);
};
