import { Scenes } from 'telegraf';
import { splitArray } from '../utils/utils';
import { IContextBot } from '../config/context.interface';

import { getPage, parseLinks } from './instagram.service';
import { isLinkAction } from './checkers';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';

export const INSTA_SCENE = 'instaScene';
export const instaScene = new Scenes.BaseScene<IContextBot>(INSTA_SCENE);

const mediaEmoji = { photo: '📷', video: '🎥' };

instaScene.enter(async (ctx) => {
	const handelEnter = async () => {
		const originalLink: string = ctx.state.link;

		try {
			const page = await getPage(originalLink);
			const links = parseLinks(page);

			if ('message' in ctx.update) {
				const currentId = ctx.update.message.from.id;
				const allUsersExceptCurrent =
					ctx.session.data?.filter(
						({ userId }) => userId !== currentId
					) ?? [];
				const currentUser = {
					userId: currentId,
					instaLinks: [...links],
					instaOriginal: originalLink,
				};
				ctx.session.data = [...allUsersExceptCurrent, currentUser];

				startInteraction(ctx.update.message.from, 'insta');
			}

			// links exist
			if (links.length > 0) {
				// one link
				if (links.length === 1) {
					const link = links[0];
					console.log(`[${link.source}](${originalLink})`);

					switch (link.type) {
						case 'photo':
							await ctx.replyWithPhoto(link.href!, {
								caption: `[${link.source}](${originalLink})`,
								parse_mode: 'MarkdownV2',
							});
							break;
						case 'video':
							await ctx.replyWithVideo(link.href!, {
								caption: `[${link.source}](${originalLink})`,
								parse_mode: 'MarkdownV2',
							});
							break;
						default:
							break;
					}
					// many links
				} else if (links.length > 1) {
					const buttons = links.map(({ type }, i) => [
						{
							text: `${
								mediaEmoji[type as 'photo' | 'video'] ?? ''
							} ${type} ${i + 1}`,
							callback_data: `download@${i}`,
						},
					]);
					// FIXME: more than 10 files doesn't sending at once
					if (links.length < 11) {
						// if length less than 10, add button for upload all files at once
						buttons.push([
							{
								text: ctx.i18n.t('downloadAll'),
								callback_data: `download@All`,
							},
						]);
					}

					await ctx.reply(ctx.i18n.t('containsManyLinks'), {
						reply_markup: { inline_keyboard: buttons },
					});
				}
			} else throw new Error();
		} catch (error) {
			console.log(error);
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
		}
	};

	handelEnter();
});

instaScene.action(isLinkAction, async (ctx) => {
	const handelAction = async () => {
		const currentId = ctx.update.callback_query.from.id;
		const currentUser = ctx.session.data?.find(
			(u) => u.userId === currentId
		);
		const link = currentUser?.instaLinkOne;
		const originalLink = currentUser?.instaOriginal;

		await ctx.answerCbQuery();
		try {
			await ctx.reply(ctx.i18n.t('uploadingMedia'));
			if (link === 'All') {
				const allLinks = ctx.session.data?.find(
					(u) => u.userId === currentId
				)?.instaLinks;

				if (allLinks?.length) {
					const limitedLinks = splitArray(allLinks, 5);
					for (const list of limitedLinks) {
						ctx.replyWithMediaGroup(
							list.map(({ href, type, source }, i) => {
								const media = {
									media: { url: href! },
									type: type as 'photo' | 'video',
								};
								// add caption only to the first link
								if (i === 0) {
									return {
										...media,
										caption: `[${source}](${originalLink})`,
										parse_mode: 'Markdown',
									};
								}
								return media;
							})
						);
						await new Promise((ok) => setTimeout(ok, 3000));
					}
				}
			} else if (typeof link === 'object') {
				switch (link.type) {
					case 'photo':
						await ctx.replyWithPhoto(link.href!, {
							caption: `[${link.source}](${originalLink})`,
							parse_mode: 'Markdown',
						});
						break;
					case 'video':
						await ctx.replyWithVideo(link.href!, {
							caption: `[${link.source}](${originalLink})`,
							parse_mode: 'Markdown',
						});
						break;
					default:
						break;
				}
			}
		} catch (error) {
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			console.log(error);
		}

		endInteraction(ctx.update.callback_query.from, 'insta');
	};

	handelAction();
});
