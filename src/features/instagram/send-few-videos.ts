import { InstagramLink } from '@entities/instagram';
import { IContextBot } from '@shared/config';
import { splitArray, timeout } from '@shared/utils';

import { MAX_FILE_LIMIT } from './model/consts';

interface SendFewVideosArgs {
	ctx: IContextBot;
	links: InstagramLink[];
	originalLink: string;
}

export const sendFewVideos = async ({
	ctx,
	links,
	originalLink,
}: SendFewVideosArgs) => {
	const limitedLinks = splitArray(links, MAX_FILE_LIMIT);
	for (const list of limitedLinks) {
		ctx.replyWithMediaGroup(
			list.map(({ href, type, source }, i) => {
				const filename = `${source}.${
					type === 'video' ? 'mp4' : 'jpg'
				}`;
				/** add caption only to the first link */
				if (i === 0) {
					return {
						type,
						media: {
							url: href,
							filename,
						},
						caption: `<a href='${originalLink}'>${links[0].source}</a>`,
						parse_mode: 'HTML',
					};
				}
				return {
					type,
					media: { url: href, filename },
				};
			})
		);
		await timeout(2000);
	}
};
