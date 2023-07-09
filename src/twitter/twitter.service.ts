/* eslint-disable @typescript-eslint/naming-convention */
import puppeteer from 'puppeteer';

import { puppeteerExecutablePath } from '../consts';
import { removeLastLink } from './helpers';
import { TweetInfo, TwitterResponse } from './types';

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

const formatter = Intl.NumberFormat('en', { notation: 'compact' });

interface MakeActionsBtnsProps extends TweetInfo {
	count: number;
}

const makeActionsBtns = (args: MakeActionsBtnsProps) => {
	const {
		favorite_count,
		retweet_count,
		quote_count,
		count,
		bookmark_count,
	} = args;

	return [
		`❤️ ${formatter.format(favorite_count)}`,
		`🔁 ${formatter.format(retweet_count)}`,
		`🗣🔁 ${formatter.format(quote_count)}`,
		`👀 ${formatter.format(count)}`,
		`🔖 ${formatter.format(bookmark_count)}`,
	];
};

const makeMediaFiles = (media: Pick<TweetInfo, 'extended_entities'>) => {
	const mediaFiles: MediaFiles[] = [] as MediaFiles[];
	if (media?.extended_entities?.media) {
		media.extended_entities.media.forEach(({ media_url_https, video_info }) => {
				if (video_info?.variants) {
					mediaFiles.push({
						type: 'video',
						href: video_info?.variants[0].url, //** add the lowest quality */
					});
					return;
				}
				mediaFiles.push({ type: 'photo', href: media_url_https });
			}
		);
	}
	return mediaFiles;
};

interface MakeTweetTextProps {
	originalLink: string;
	full_text: string;
	name?: string;
	screen_name: string;
	linksText: string;
}

const makeTweetText = ({
	originalLink,
	full_text,
	name,
	screen_name,
	linksText,
}: MakeTweetTextProps) => {
	const text = `<a href="${originalLink}">👤 ${
		name ?? screen_name
	}: </a>\n\n${removeLastLink(full_text)}${
		linksText ? `\n${linksText}` : ''
	}`;

	return text;
};

export const parseJson = (tweetJson: TwitterResponse, originalLink: string) => {
	/** Main tweet */
	const { core, legacy, quoted_status_result, views } = tweetJson.data!.tweetResult.result;

	const { full_text } = legacy;

	const { count } = views;

	const { name, screen_name } = core.user_results.result.legacy;

	const actionsBtn = makeActionsBtns({ ...legacy, count });

	const mediaFiles = makeMediaFiles(legacy);
	const videoLinks = mediaFiles.filter(({ type }) => type === 'video');
	const videoLinksText = videoLinks
		.map(({ href }, i) => `<a href='${href}'>${i + 1}. Video</a>`)
		.join('\n');

	const mainText = makeTweetText({
		originalLink,
		full_text,
		name,
		screen_name,
		linksText: videoLinksText,
	});

	let fullCaption = mainText;
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
						? `<a href="${video_info?.variants?.[2].url}">${i + 1}. Video</a>` //** add the highest quality */
						: `<a href='${media_url_https}'>${i + 1}. Photo</a>`
				)
				.join('\n');
		}

		const quotedText = makeTweetText({
			originalLink,
			full_text: quotedFullText,
			name: quotedName,
			screen_name: quotedScreenName,
			linksText: links,
		});

		fullCaption += `\n\n<strong>Reply to </strong>${quotedText}`;
	}

	return {
		fullCaption,
		actionsBtn,
		mediaFiles,
	};
};
