import { Scenes } from 'telegraf';
import ytdl from 'ytdl-core';

import {
	createLinksKeyboard,
	createStatsKeyboard,
	getPage,
	parsePage,
	YouTubeLink,
} from '@entities/youtube';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { ChatType, IContextBot } from '@shared/config';
import { retryGettingPage, timeout } from '@shared/utils';

export const youtubeScene = new Scenes.BaseScene<IContextBot>('youtubeScene');

const MAX_ALLOWED_SIZE = 50; // mb
const RETRIES_COUNT = 2;
const MAX_TIMEOUT = 25_000;

const filterUploadableLinks = (links: YouTubeLink[]) => {
	return links.filter(({ size }) => size && size <= MAX_ALLOWED_SIZE);
};

youtubeScene.enter((ctx) => {
	const originalLink: string = ctx.state.link;
	const chatType: ChatType = ctx.state.chatType;

	const handleEnter = async () => {
		onServiceInit({ ctx, socialMediaType: 'youtube' });

		try {
			const page = await retryGettingPage(
				RETRIES_COUNT,
				originalLink,
				getPage,
				MAX_TIMEOUT
			);

			if (!page) throw new Error('smthWentWrong');

			const links = await parsePage(page);
			const linksKeyboard = createLinksKeyboard(links);

			const uploadableLinks = filterUploadableLinks(links);
			if (uploadableLinks.length > 0 && chatType === 'private') {
				await ctx.reply(ctx.i18n.t('beforeUpload'), {
					parse_mode: 'HTML',
					reply_markup: { inline_keyboard: linksKeyboard },
				});
			}

			const videoInfo = await Promise.race([
				ytdl.getInfo(originalLink),
				timeout(20_000),
			]).catch(() => {});

			let caption = links[0].descr ?? ctx.i18n.t('savedByBot');
			let statsKeyboard = null;
			let filename = links[0].title;
			if (videoInfo) {
				const { title, likes, viewCount, dislikes, author } =
					videoInfo.videoDetails;
				caption = `${title}\n\n<a href='${originalLink}'>👤 ${
					author.name ?? author.user
				}</a>`;
				filename = `${title}.mp4`;
				statsKeyboard = createStatsKeyboard({
					likes,
					dislikes,
					viewCount,
				});
			}

			if (uploadableLinks.length > 0) {
				const link = uploadableLinks[0];

				const replyOptions = statsKeyboard
					? {
							caption,
							reply_markup: {
								inline_keyboard: statsKeyboard,
							},
							parse_mode: 'HTML',
					  }
					: { caption };

				await ctx.replyWithVideo(
					{ url: link.href, filename },
					replyOptions as any
				);
				return;
			}

			await ctx.reply(caption, {
				parse_mode: 'HTML',
				reply_markup: { inline_keyboard: linksKeyboard },
			});

			throw new Error('tooLargeSize');
		} catch (error) {
			console.error(error);
			if (error instanceof Error) {
				if (error.message.includes('410')) {
					ctx.reply(ctx.i18n.t('regionError'));
					throw new TypeError(error.message);
				}
				if (error.message === 'tooLargeSize') {
					ctx.reply(ctx.i18n.t('tooLargeSize'));
					throw new TypeError(error.message);
				}
				await ctx.reply(ctx.i18n.t('smthWentWrong'));
				throw new TypeError(error.message);
			}
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			throw new Error('smthWentWrong');
		}
	};
	handleEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'youtube',
				status: 'success',
				originalLink,
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'youtube',
				status: 'error',
				error,
				originalLink,
			})
		);
});
