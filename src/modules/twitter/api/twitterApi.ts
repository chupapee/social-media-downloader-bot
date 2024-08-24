import { ScrapingError } from 'shared/api';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';
import { closePageDelay } from 'shared/utils';

import { TweetJson } from '../model';

const API_JSON_DATA = [
	'https://x.com/i/api/graphql',
	'https://api.x.com/graphql',
];

export const getPage = async (
	twitterLink: string
): Promise<TweetJson | undefined> => {
	try {
		const browser = await PuppeteerBrowser.getInstance();

		const page = await browser.newPage();
		closePageDelay(page, 120_000);

		await page
			.goto(twitterLink, { waitUntil: 'domcontentloaded' })
			.catch(() => null);

		const response = await page.waitForResponse(
			(res) =>
				res.request().method().toUpperCase() !== 'OPTIONS' &&
				API_JSON_DATA.some((api) => res.url().includes(api)) &&
				res.status() === 200,
			{
				timeout: 20_000,
			}
		);

		const content: TweetJson = await response.json();

		await page.close();
		if (!content.data) throw new TweetEmptyError('🚫 Tweet data is empty');
		if (content.data.tweetResult.result.__typename === 'TweetUnavailable') {
			throw new TweetUnavailableError(
				'🔒 Unfortunately, this tweet is protected and unavailable for viewing'
			);
		}

		return content;
	} catch (error) {
		if (error instanceof TweetEmptyError) {
			throw new TweetEmptyError(error.message);
		}
		if (error instanceof TweetUnavailableError) {
			throw new TweetUnavailableError(error.message);
		}
		throw new ScrapingError(
			'🚫 Link could not be scraped, please check it or try again later',
			error
		);
	}
};

export class TweetUnavailableError extends Error {
	constructor(message: string) {
		super();
		this.name = this.constructor.name;
		this.message = message;
	}
}

export class TweetEmptyError extends Error {
	constructor(message: string) {
		super();
		this.name = this.constructor.name;
		this.message = message;
	}
}
