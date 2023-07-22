import {
	createInlineKeyboard,
	downloadLink,
	InstagramLink,
} from '@entities/instagram';
import { IContextBot } from '@shared/config';
import { splitArray } from '@shared/utils';

import { MAX_FILE_LIMIT } from './model/consts';

interface SendManyFileArgs {
	ctx: IContextBot;
	links: InstagramLink[];
	originalLink: string;
}

export const sendManyFiles = async ({
	ctx,
	links,
	originalLink,
}: SendManyFileArgs) => {
	const photos = links.filter(({ type }) => type === 'photo');
	const videos = links.filter(({ type }) => type === 'video');

	/** first send all photos and only 3 videos */
	const bufferList = [];
	for (const link of [...photos, ...videos.slice(0, 3)]) {
		const buffer = await downloadLink(link.href);
		if (buffer) bufferList.push({ buffer, type: link.type });
	}

	const limitedLinks = splitArray(bufferList, MAX_FILE_LIMIT);
	for (const list of limitedLinks) {
		await ctx.replyWithMediaGroup(
			list.map(({ type, buffer }) => {
				return {
					type,
					media: { source: buffer },
				};
			})
		);
	}

	/** send other videos links */
	await ctx.reply(
		`<a href='${ctx.i18n.t('otherVideos')} ${
			links[0].source
		}:'>${originalLink}</a>`,
		{
			reply_markup: {
				inline_keyboard: createInlineKeyboard(videos.slice(3)),
			},
			parse_mode: 'HTML',
		}
	);
};
