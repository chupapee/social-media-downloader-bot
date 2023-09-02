import { MoreVideoDetails } from 'ytdl-core';

import {
	createLinksKeyboard,
	createStatsKeyboard,
	getPage,
	parsePage,
	YouTubeLink,
} from '@entities/youtube';
import { IContextBot } from '@shared/config';
import { downloadLink, retryGettingPage } from '@shared/utils';

const MAX_ALLOWED_SIZE = 48; // mb
const RETRIES_COUNT = 3;
const MAX_TIMEOUT = 20_000;

interface ScrapeAndSendArgs {
	ctx: IContextBot;
	originalLink: string;
	videoDetails: MoreVideoDetails;
}

const filterLinks = (links: YouTubeLink[]) => {
	return links.filter(({ size }) => size && size <= MAX_ALLOWED_SIZE);
};

export const scrapeAndSend = async ({
	ctx,
	originalLink,
	videoDetails,
}: ScrapeAndSendArgs) => {
	const { title, likes, viewCount, dislikes, author } = videoDetails;

	const statsKeyboard = createStatsKeyboard({
		likes,
		dislikes,
		viewCount,
	});

	const caption = `${title}\n\n<a href='${originalLink}'>👤 ${
		author.name ?? author.user
	}</a>`;

	const filename = `${title}.mp4`;

	const page = await retryGettingPage(
		RETRIES_COUNT,
		originalLink,
		getPage,
		MAX_TIMEOUT
	);
	if (!page) throw new Error('parsing page failed');

	const links = await parsePage(page);
	const linksKeyboard = createLinksKeyboard(links);

	const uploadableLinks = filterLinks(links);
	if (uploadableLinks.length > 0) {
		await ctx.reply(ctx.i18n.t('beforeUpload'), {
			parse_mode: 'HTML',
			reply_markup: { inline_keyboard: linksKeyboard },
		});

		const link = uploadableLinks[0];
		const buffer = await downloadLink(link.href);
		if (buffer) {
			await ctx.replyWithVideo(
				{ source: buffer, filename },
				{
					caption,
					reply_markup: {
						inline_keyboard: statsKeyboard,
					},
					parse_mode: 'HTML',
				}
			);
			return;
		}
	}

	await ctx.reply(caption, {
		parse_mode: 'HTML',
		reply_markup: { inline_keyboard: linksKeyboard },
	});
	throw new Error('tooLargeSize');
};
