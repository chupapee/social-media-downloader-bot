import { INSTA_PAGE_URL } from 'shared/config/config.service';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';
import { timeout } from 'shared/utils';

export const getPage = async (link: string) => {
	try {
		const browser = await PuppeteerBrowser.getInstance();
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

		await page.close();
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('Something went wrong, please try again');
	}
};
