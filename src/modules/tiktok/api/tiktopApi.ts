import { ScrapingError } from 'shared/api';
import { TIKTOK_PAGE_URL } from 'shared/config/config.service';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';
import { closePageDelay } from 'shared/utils';

export const getPage = async (link: string) => {
	try {
		const browser = await PuppeteerBrowser.getInstance();
		const page = await browser.newPage();
		closePageDelay(page, 120_000);

		//** wait until page fully loaded */
		await page.goto(TIKTOK_PAGE_URL, { waitUntil: 'networkidle2' });

		const input = await page.$('#url');
		await input?.type(link);
		await page.click('button[type="submit"]');
		await page.waitForSelector('.download-file');

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
