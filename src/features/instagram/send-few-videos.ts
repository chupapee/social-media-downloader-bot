import { IContextBot } from '../../config';
import { downloadLink, InstagramLink } from '../../entities/instagram';
import { splitArray, timeout } from '../../utils';
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
	const bufferList = [];
	for (const link of links) {
		const buffer = await downloadLink(link.href);
		if (buffer) bufferList.push({ buffer, type: link.type });
	}

	const limitedLinks = splitArray(bufferList, MAX_FILE_LIMIT);
	for (const list of limitedLinks) {
		ctx.replyWithMediaGroup(
			list.map(({ buffer, type }, i) => {
				/** add caption only to the first link */
				if (i === 0) {
					return {
						type,
						media: { source: buffer },
						caption: `<a href='${originalLink}'>${links[0].source}</a>`,
						parse_mode: 'HTML',
					};
				}
				return {
					type,
					media: { source: buffer },
				};
			})
		);
		await timeout(3000);
	}
};
