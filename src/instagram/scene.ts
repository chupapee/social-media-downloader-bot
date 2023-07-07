import { Scenes } from 'telegraf';

import { IContextBot } from '../config/context.interface';
import { sendToAuthor } from '../helpers';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';
import { splitArray, timeout } from '../utils/utils';
import { createInlineKeyboard, downloadLink } from './helpers';
import { getPage, parseLinks } from './instagram.service';

const INSTA_SCENE = 'instaScene';
export const instaScene = new Scenes.BaseScene<IContextBot>(INSTA_SCENE);

instaScene.enter(async (ctx) => {
	const handelEnter = async () => {
		const originalLink: string = ctx.state.link;
		const isReels = originalLink.includes('reel');

		try {
			const page = await getPage(originalLink);
			const links = parseLinks(page);

			const photos = links.filter(({ type }) => type === 'photo');
			const videos = links.filter(({ type }) => type === 'video');

			if ('message' in ctx.update) {
				sendToAuthor({
					author: ctx.update.message.from,
					scene: 'Insta',
					link: originalLink,
					additional: 'insta link handling started! 🚀',
				});
				startInteraction(ctx.update.message.from, 'insta');
			}

			// reels || single file
			if (isReels || links.length === 1) {
				const link = links[0];
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
				return;
			}

			// no more than 3 videos at once
			if (videos.length <= 3) {
				const bufferList: Record<'buffer' | 'type', Buffer | string>[] = [];
				for (const link of links) {
					const buffer = await downloadLink(link.href);
					if (buffer) bufferList.push({ buffer, type: link.type });
				}

				const limitedLinks = splitArray(bufferList, 5);
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
				return;
			}

			// more than 3 videos && any count of photos

			// first send all photos and only 3 videos
			if (photos.length > 0) {
				const bufferList: Record<'buffer' | 'type', Buffer | string>[] = [];
				for (const link of [...photos, ...videos.slice(0, 3)]) {
					const buffer = await downloadLink(link.href);
					if (buffer) bufferList.push({ buffer, type: link.type });
				}

				const limitedLinks = splitArray(bufferList, 5);
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
			} else {
				// if there're only videos
				const bufferList: Record<'buffer' | 'type', Buffer | string>[] = [];
				for (const link of [...videos.slice(0, 3)]) {
					const buffer = await downloadLink(link.href);
					if (buffer) bufferList.push({ buffer, type: link.type });
				}

				await ctx.replyWithMediaGroup(
					bufferList.map(({ buffer }) => ({
						media: { source: buffer as Buffer },
						type: 'video',
					}))
				);
			}

			// and then send link to other videos
			await ctx.reply(
				`[${ctx.i18n.t('otherVideos')} ${
					links[0].source
				}:](${originalLink})`,
				{
					reply_markup: {
						inline_keyboard: createInlineKeyboard(videos.slice(3)),
						resize_keyboard: false,
					},
					parse_mode: 'Markdown',
				}
			);
		} catch (error) {
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			console.error(error, 'insta error');
			if (error instanceof Error) throw new Error(error.message);
		}
	};

	handelEnter()
		.then(() => {
			if ('message' in ctx.update) {
				endInteraction(ctx.update.message.from, 'insta');
				sendToAuthor({
					author: ctx.update.message.from,
					link: ctx.state.link,
					scene: 'Insta',
					additional: 'insta link successfully handled! ✅',
				});
			}
		})
		.catch((error) => {
			if ('message' in ctx.update) {
				sendToAuthor({
					author: ctx.update.message.from,
					link: ctx.state.link,
					scene: 'Insta',
					additional: `insta link handling failed! ❌\nError: ${error}`,
				});
			}
		});
});
