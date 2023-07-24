import puppeteer from 'puppeteer';

import { YOUTUBE_PAGE_URL } from '@shared/config';
import { puppeteerExecutablePath } from '@shared/consts';
import { timeout } from '@shared/utils';

export const getPage = async (link: string) => {
	try {
		const browser = await puppeteer.launch({
			executablePath: puppeteerExecutablePath,
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();

		await page.goto(YOUTUBE_PAGE_URL, { waitUntil: 'domcontentloaded' });

		const input = await page.$('#sf_url');
		await timeout(1000);

		await input?.type(link);
		await timeout(1000);

		await page.click('#sf_submit');
		await page.waitForSelector('.link-box', { timeout: 25_000 });

		const content = await page.content();

		await browser.close();
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('Something went wrong, please try again');
	}
};
