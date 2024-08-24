import { TIKTOK_PAGE_URL } from 'shared/config/config.service';
import { PuppeteerBrowser } from 'shared/config/puppeteer.config';

export const getPage = async (link: string) => {
	try {
		const browser = await PuppeteerBrowser.getInstance();
		const page = await browser.newPage();

		//** wait until page fully loaded */
		await page.goto(TIKTOK_PAGE_URL, { waitUntil: 'networkidle2' });

		const input = await page.$('#url');
		await input?.type(link);
		await page.click('button[type="submit"]');
		await page.waitForSelector('.download-file', { timeout: 20_000 });

		const content = await page.content();

		await page.close();
		return content;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		throw new Error('Something went wrong, please try again');
	}
};
