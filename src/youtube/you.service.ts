import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

import { ConfigService } from '../config/config.service';
import { IYouLink } from '../config/context.interface';
import { puppeteerExecutablePath } from '../consts';
import { timeout } from '../utils/utils';

const PAGE_URL = new ConfigService().get('YOUTUBE_PAGE_URL');

export const getPage = async (link: string) => {
	try {
		const browser = await puppeteer.launch({
			executablePath: puppeteerExecutablePath,
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();

		await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });

		const input = await page.$('#sf_url');
		await timeout(500);

		await input?.type(link);
		await timeout(500);

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

const getUniqueListBy = <T>(arr: T[], key: keyof T) => {
	return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const parseLink = (page: string) => {
	const $ = cheerio.load(page);

	const links: IYouLink[] = [];

	$('a.link-download').each((_, el) => {
		const title = $(el).attr('title') ?? '';

		const descr = $(el).attr('download') ?? '';
		const quality = $(el).attr('data-quality') ?? '';
		const href = $(el).attr('href') ?? '';

		links.push({ title, descr, quality, href });
	});

	return getUniqueListBy(links, 'title');
};
