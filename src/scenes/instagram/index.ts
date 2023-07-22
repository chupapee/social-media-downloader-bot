import { Scenes } from 'telegraf';

import { getPage, parsePage } from '@entities/instagram';
import {
	MAX_VIDEOS_LIMIT,
	sendFewVideos,
	sendManyFiles,
	sendSingleFile,
} from '@features/instagram';
import { onServiceFinish, onServiceInit } from '@features/scenes';
import { IContextBot } from '@shared/config';

export const instagramScene = new Scenes.BaseScene<IContextBot>(
	'instagramScene'
);

instagramScene.enter((ctx) => {
	const handelEnter = async () => {
		const originalLink: string = ctx.state.link;
		const isReels = originalLink.includes('reel');
		onServiceInit({ ctx, originalLink, socialMediaType: 'insta' });

		try {
			const page = await getPage(originalLink);
			const links = parsePage(page);

			const videos = links.filter(({ type }) => type === 'video');

			if (isReels || links.length === 1) {
				await sendSingleFile({
					ctx,
					originalLink,
					link: links[0],
				});
				return;
			}

			/** max 5 videos at once
			 * and any count of photos
			 */
			if (videos.length <= MAX_VIDEOS_LIMIT) {
				await sendFewVideos({ ctx, links, originalLink });
				return;
			}

			/**
			 * MORE than 5 videos
			 * and any count of photos
			 * */
			await sendManyFiles({ ctx, links, originalLink });
		} catch (error) {
			await ctx.reply(ctx.i18n.t('smthWentWrong'));
			console.error(error, 'insta error');
			if (error instanceof Error) throw new Error(error.message);
		}
	};

	handelEnter()
		.then(() =>
			onServiceFinish({
				ctx,
				socialMediaType: 'insta',
				status: 'success',
			})
		)
		.catch((error) =>
			onServiceFinish({
				ctx,
				socialMediaType: 'insta',
				status: 'error',
				error,
			})
		);
});
