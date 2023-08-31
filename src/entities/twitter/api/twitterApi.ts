import puppeteer from 'puppeteer';

import {
	PROXY_HOST,
	PROXY_LOGIN,
	PROXY_PASS,
	PROXY_PORT,
} from '@shared/config';
import { puppeteerExecutablePath } from '@shared/consts';

import { TweetJson } from '../model';

const PROXY_ADDRESS = PROXY_HOST ? PROXY_HOST + ':' + PROXY_PORT : '';
const API_JSON_DATA = 'https://twitter.com/i/api/graphql';

export const getPage = async (
	twitterLink: string
): Promise<TweetJson | undefined> => {
	try {
		const browser = await puppeteer.launch({
			executablePath: puppeteerExecutablePath,
			headless: 'new',
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				`--proxy-server=${PROXY_ADDRESS}`,
			],
		});

		const page = await browser.newPage();

		await page.authenticate({
			username: PROXY_LOGIN,
			password: PROXY_PASS,
		});

		await page
			.goto(twitterLink, { waitUntil: 'domcontentloaded' })
			.catch(() => null);

		const response = await page.waitForResponse(
			(res) =>
				res.url().startsWith(API_JSON_DATA) && res.status() === 200,
			{
				timeout: 50_000,
			}
		);

		const content: TweetJson = await response.json();
		await browser.close();
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
