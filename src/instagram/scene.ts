import { Scenes } from 'telegraf';

import { IContextBot, InstaLink } from '../config';
import { sendToAuthor } from '../helpers';
import { statsModel } from '../statsDb';
import { splitArray, timeout } from '../utils';
import { createInlineKeyboard, downloadLink } from './helpers';
import { getPage, parseLinks } from './instagram.service';

const INSTA_SCENE = 'instaScene';
export const instaScene = new Scenes.BaseScene<IContextBot>(INSTA_SCENE);

const MAX_FILES_AT_ONCE = 5;
interface LinksBuffer {
	buffer: Buffer;
	type: string;
}

const handleSingleLink = async (
	ctx: IContextBot,
	originalLink: string,
	link: InstaLink
) => {
	const buffer = await downloadLink(link.href);
	if (link.type === 'video') {
		await ctx.replyWithVideo(
			{ source: buffer! },
			{
				caption: `[${link.source}](${originalLink})`,
				parse_mode: 'MarkdownV2',
			}
		);
		return;
	}
	await ctx.replyWithPhoto(
		{ source: buffer! },
		{
			caption: `[${link.source}](${originalLink})`,
			parse_mode: 'MarkdownV2',
		}
	);

	if ('message' in ctx.update) {
		statsModel.endInteraction(ctx.update.message.from, 'twitter');
		sendToAuthor(
			{
				additional: `Insta link successfully handled! ✅`,
			},
			'short'
		);
	}
};

const handleFewVideos = async (
	ctx: IContextBot,
	links: InstaLink[],
	originalLink: string
) => {
	const bufferList: LinksBuffer[] = [];
	for (const link of links) {
		const buffer = await downloadLink(link.href);
		if (buffer) bufferList.push({ buffer, type: link.type });
	}

	const limitedLinks = splitArray(bufferList, MAX_FILES_AT_ONCE);
	for (const list of limitedLinks) {
		ctx.replyWithMediaGroup(
			list.map(({ buffer, type }, i) => {
				// add caption only to the first link
				if (i === 0) {
					return {
						media: { source: buffer as Buffer },
						type: type as 'photo' | 'video',
						caption: `[${links[0].source}](${originalLink})`,
						parse_mode: 'Markdown',
					};
				}
				return {
					media: { source: buffer as Buffer },
					type: type as 'photo' | 'video',
				};
			})
		);
		await timeout(3000);
	}

	if ('message' in ctx.update) {
		statsModel.endInteraction(ctx.update.message.from, 'twitter');
		sendToAuthor(
			{
				additional: `Insta link successfully handled! ✅`,
			},
			'short'
		);
	}
};

const handleManyFiles = async (
	ctx: IContextBot,
	links: InstaLink[],
	originalLink: string
) => {
	const photos = links.filter(({ type }) => type === 'photo');
	const videos = links.filter(({ type }) => type === 'video');

	/** first send all photos && only 3 videos */
	const bufferList: LinksBuffer[] = [];
	for (const link of [...photos, ...videos.slice(0, 3)]) {
		const buffer = await downloadLink(link.href);
		if (buffer) bufferList.push({ buffer, type: link.type });
	}

	const limitedLinks = splitArray(bufferList, MAX_FILES_AT_ONCE);
	for (const list of limitedLinks) {
		await ctx.replyWithMediaGroup(
			list.map(({ type, buffer }) => {
				return {
					media: { source: buffer as Buffer },
					type: type as 'photo' | 'video',
				};
			})
		);
	}

	/** and then send links of other videos */
	await ctx.reply(
		`[${ctx.i18n.t('otherVideos')} ${links[0].source}:](${originalLink})`,
		{
			reply_markup: {
				inline_keyboard: createInlineKeyboard(videos.slice(3)),
				resize_keyboard: false,
			},
			parse_mode: 'Markdown',
		}
	);

	if ('message' in ctx.update) {
		statsModel.endInteraction(ctx.update.message.from, 'twitter');
		sendToAuthor(
			{
				additional: `Insta link successfully handled! ✅`,
			},
			'short'
		);
	}
};

instaScene.enter(async (ctx) => {
	const handelEnter = async () => {
		const originalLink: string = ctx.state.link;
		const isReels = originalLink.includes('reel');

		try {
			const page = await getPage(originalLink);
			const links = parseLinks(page);

			const videos = links.filter(({ type }) => type === 'video');

			if ('message' in ctx.update) {
				sendToAuthor(
					{
						author: ctx.update.message.from,
						link: originalLink,
						additional: 'insta link handling started! 🚀',
					},
					'full'
				);
				statsModel.startInteraction(ctx.update.message.from, 'insta');
			}

			/**
			 * LESS than 3 videos && any count of photos handlers
			 * */

			/** reels || single file */
			if (isReels || links.length === 1) {
				await handleSingleLink(ctx, originalLink, links[0]);
				return;
			}

			/** max 3 videos at once */
			if (videos.length <= 3) {
				await handleFewVideos(ctx, links, originalLink);
				return;
			}

			/**
			 * MORE than 3 videos && any count of photos handlers
			 * */
			await handleManyFiles(ctx, links, originalLink);
		} catch (error) {
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			console.error(error, 'insta error');
			if (error instanceof Error) throw new Error(error.message);
		}
	};

	handelEnter()
		.then(() => {
			if ('message' in ctx.update) {
				statsModel.endInteraction(ctx.update.message.from, 'insta');
				sendToAuthor(
					{
						additional: 'insta link successfully handled! ✅',
					},
					'short'
				);
			}
		})
		.catch((error) => {
			if ('message' in ctx.update) {
				sendToAuthor(
					{
						additional: `insta link handling failed! ❌\nError: ${error}`,
					},
					'short'
				);
			}
		});
});
