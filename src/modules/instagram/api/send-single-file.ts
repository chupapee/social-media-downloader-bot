import { createEffect } from 'effector';
import { bot } from 'main';
import { bytesToMegaBytes, downloadLink } from 'shared/utils';

import { InstagramLink } from '../model/types';

interface SendSingleFileArgs {
	chatId: string;
	link: string;
	instagramLinkData: InstagramLink;
}

export const sendSingleFile = createEffect(
	async ({ chatId, link, instagramLinkData }: SendSingleFileArgs) => {
		const filename =
			instagramLinkData.source.length > 0
				? instagramLinkData.source
				: instagramLinkData.type;

		if (instagramLinkData.type === 'video') {
			const downloadedVideo = await downloadLink(instagramLinkData.href);
			const videoOpt =
				downloadedVideo && bytesToMegaBytes(downloadedVideo.byteLength) < 50
					? { source: downloadedVideo, filename: `${filename}.mp4` }
					: { url: instagramLinkData.href, filename: `${filename}.mp4` };

			await bot.telegram.sendVideo(chatId, videoOpt, {
				caption: `<a href='${link}'>${instagramLinkData.source}</a>`,
				parse_mode: 'HTML',
			});
			return;
		}

		await bot.telegram.sendPhoto(
			chatId,
			{ url: instagramLinkData.href, filename: `${filename}.jpg` },
			{
				caption: `<a href='${link}'>${instagramLinkData.source}</a>`,
				parse_mode: 'HTML',
			}
		);
	}
);
