import { ScrapingError } from 'shared/api';
import { INSTA_PAGE_URL } from 'shared/config/config.service';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';
import { closePageDelay, timeout } from 'shared/utils';

export const getPage = async (link: string) => {
	try {
		const browser = await PuppeteerBrowser.getInstance();
		const page = await browser.newPage();
		closePageDelay(page, 120_000);

		await page.goto(INSTA_PAGE_URL, { waitUntil: 'domcontentloaded' });

		const input = await page.$('#url');
		await timeout(1000);

		await input?.type(link);
		await timeout(1000);

		await page.waitForSelector('#btn-submit');
		await page.click('#btn-submit');

		await page.waitForSelector('.download-content', { timeout: 40_000 });

		const content = await page.content();

		await page.close();
		return content;
	} catch (error) {
		console.log(error);

		throw new ScrapingError(
			'🚫 Link could not be scraped, please check it or try again later',
			error
		);
	}
};
