import { createEffect } from 'effector';
import { bot } from 'main';

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
			await bot.telegram.sendVideo(
				chatId,
				{ url: instagramLinkData.href!, filename: `${filename}.mp4` },
				{
					caption: `<a href='${link}'>${instagramLinkData.source}</a>`,
					parse_mode: 'HTML',
				}
			);
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
