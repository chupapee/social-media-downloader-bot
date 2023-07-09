/* eslint-disable @typescript-eslint/naming-convention */
import puppeteer from 'puppeteer';

import { puppeteerExecutablePath } from '../consts';
import { TwitterResponse } from './types';

const API_JSON_DATA = 'https://twitter.com/i/api/graphql';

export const getPage = async (
	twitterLink: string
): Promise<TwitterResponse> => {
	try {
		const browser = await puppeteer.launch({
			executablePath: puppeteerExecutablePath,
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		const page = await browser.newPage();
		await page
			.goto(twitterLink, { waitUntil: 'domcontentloaded' })
			.catch(() => null);

		const response = await page.waitForResponse(
			(res) => res.url().startsWith(API_JSON_DATA),
			{
				timeout: 50_000,
			}
		);

		const content: TwitterResponse = await response.json();
		await browser.close();
		if (!content.data) throw new Error('data not found');
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('something went wrong');
	}
};

interface MediaFiles {
	href: string;
	type: 'photo' | 'video';
}

export const parseJson = (tweetJson: TwitterResponse, originalLink: string) => {
	/** Main tweet */
	const { core, legacy, quoted_status_result, views } = tweetJson.data!.tweetResult.result;

	const {
		full_text,

		favorite_count,
		retweet_count,
		quote_count,
		bookmark_count,

		extended_entities,
	} = legacy;

	const { count } = views;

	const { name, screen_name } = core.user_results.result.legacy;

	const formatter = Intl.NumberFormat('en', { notation: 'compact' });
	const actionsBtn = [
		`❤️ ${formatter.format(favorite_count)}`,
		`🔁 ${formatter.format(retweet_count)}`,
		`🔁🗣 ${formatter.format(quote_count)}`,
		`👀 ${formatter.format(count)}`,
		`🔖 ${formatter.format(bookmark_count)}`,
	];

	const mediaFiles: MediaFiles[] = [];
	if (extended_entities?.media) {
		extended_entities.media.forEach(({ media_url_https, video_info }) => {
			if (video_info?.variants) {
				mediaFiles.push({
					type: 'video',
					href: video_info?.variants[0].url, //** add the lowest quality */
				});
				return;
			}
			mediaFiles.push({ type: 'photo', href: media_url_https });
		});
	}

	const videoLinks = mediaFiles.filter(({ type }) => type === 'video');
	const videoLinksText = videoLinks
		.map(({ href }, i) => `[${i + 1}. Video](${href})`)
		.join('\n');

	const caption = `👤 [${
		name ?? screen_name
	}:](${originalLink})\n\n${full_text}${
		videoLinksText ? `\n${videoLinksText}` : ''
	}`;

	let fullCaption = caption;
	/** Quoted tweet */
	if (quoted_status_result?.result) {
		const { core: quotedCore, legacy: quotedLegacy } = quoted_status_result.result;

		const { name: quotedName, screen_name: quotedScreenName } = quotedCore.user_results.result.legacy;
		const { full_text: quotedFullText, extended_entities } = quotedLegacy;
		let links = '';
		if (extended_entities?.media) {
			links = extended_entities.media
				.map(({ media_url_https, video_info }, i) =>
					video_info?.variants
						? `[${i + 1}. Video](${video_info?.variants?.[2].url})` //** add the highest quality */
						: `[${i + 1}. Photo](${media_url_https})`
				)
				.join('\n');
		}
		const quotedCaption = `👤 [${
			quotedName ?? quotedScreenName
		}:](${originalLink})\n\n${quotedFullText}${links ? `\n${links}` : ''}`;

		fullCaption += `\n\n***Reply to ***${quotedCaption}`;
	}

	return { fullCaption, actionsBtn, mediaFiles };
};
