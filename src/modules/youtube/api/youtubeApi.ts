import { ScrapingError } from 'shared/api';
import { YOUTUBE_PAGE_URL } from 'shared/config/config.service';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';
import { closePageDelay, timeout } from 'shared/utils';

export const getPage = async (link: string) => {
	try {
		const browser = await PuppeteerBrowser.getInstance();
		const page = await browser.newPage();
		closePageDelay(page, 120_000);

		await page.goto(YOUTUBE_PAGE_URL, { waitUntil: 'domcontentloaded' });

		const input = await page.$('#sf_url');
		await timeout(1000);

		await input?.type(link);
		await timeout(1000);

		await page.click('#sf_submit');
		await page.waitForSelector('.link-box');

		const content = await page.content();

		await page.close();
		return content;
	} catch (error) {
		throw new ScrapingError(
			'🚫 Link could not be scraped, please check it or try again later',
			error
		);
	}
};
