import { createLinksKeyboard, getPage, parsePage } from '@entities/youtube';
import { IContextBot } from '@shared/config';
import { downloadLink, retryGettingPage } from '@shared/utils';

const MAX_ALLOWED_SIZE = 48; // mb
const RETRIES_COUNT = 3;
const MAX_TIMEOUT = 20_000;

interface ScrapeAndSendArgs {
	ctx: IContextBot;
	originalLink: string;
	videoDetails: {
		caption: string;
		filename: string;
	};
}

export const scrapeAndSend = async ({
	ctx,
	originalLink,
	videoDetails,
}: ScrapeAndSendArgs) => {
	const { caption, filename } = videoDetails;
	const page = await retryGettingPage(
		RETRIES_COUNT,
		originalLink,
		getPage,
		MAX_TIMEOUT
	);
	if (!page) throw new Error('parsing page failed');
	const links = await parsePage(page);
	const allowedToUploadLinks = links.filter(
		({ size }) => size && size <= MAX_ALLOWED_SIZE
	);

	const linksKeyboard = createLinksKeyboard(links);
	await ctx.reply(ctx.i18n.t('beforeUpload'), {
		parse_mode: 'HTML',
		reply_markup: { inline_keyboard: linksKeyboard },
	});

	if (allowedToUploadLinks.length > 0) {
		const link = allowedToUploadLinks[0];
		const buffer = await downloadLink(link.href);
		if (buffer) {
			await ctx.replyWithVideo(
				{ url: link.href, filename },
				{
					caption,
					parse_mode: 'HTML',
				}
			);
			return;
		}
	}
	throw new Error('tooLargeSize');
};
