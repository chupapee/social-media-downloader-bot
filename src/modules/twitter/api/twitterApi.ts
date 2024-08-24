import { PuppeteerBrowser } from 'shared/config/puppeteer.config';

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

		await page
			.goto(twitterLink, { waitUntil: 'domcontentloaded' })
			.catch(() => null);

		const response = await page.waitForResponse(
			(res) =>
				res.request().method().toUpperCase() !== 'OPTIONS' &&
				API_JSON_DATA.some((api) => res.url().includes(api)) &&
				res.status() === 200,
			{
				timeout: 70_000,
			}
		);

		const content: TweetJson = await response.json();

		await page.close();
		if (!content.data) throw new Error('data not found');
		if (content.data.tweetResult.result.__typename === 'TweetUnavailable') {
			throw new Error('TweetUnavailable');
		}
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('something went wrong');
	}
};
