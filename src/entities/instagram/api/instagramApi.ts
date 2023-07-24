import axios from 'axios';
import puppeteer from 'puppeteer';

import { INSTA_PAGE_URL } from '@shared/config';
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

		await page.goto(INSTA_PAGE_URL, { waitUntil: 'domcontentloaded' });

		const input = await page.$('#url');
		await timeout(500);
		await new Promise((ok) => setTimeout(ok, 500));

		await input?.type(link);
		await timeout(500);

		await page.click('button[type="submit"]');
		await page.waitForSelector('.download-content', { timeout: 20_000 });

		const content = await page.content();

		await browser.close();
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('Something went wrong, please try again');
	}
};
