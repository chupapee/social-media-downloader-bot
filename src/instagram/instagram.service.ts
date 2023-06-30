import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

import { ConfigService } from '../config/config.service';
import { timeout } from './../utils/utils';
import { puppeteerExecutablePath } from '../helpers';

const PAGE_URL = new ConfigService().get('INSTA_PAGE_URL');

export const getPage = async (link: string) => {
	try {
		const browser = await puppeteer.launch({
			executablePath: puppeteerExecutablePath,
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();

		await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });

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

export const parseLinks = (page: string) => {
	const $ = cheerio.load(page);
	const links: Record<'type' | 'href' | 'source', string>[] = [];

	const source = $('[alt="avatar"]').first().parent().text();

	$('[data-event="click_download_btn"]').each((_, a) => {
		const link = $(a).attr('href');
		const type = $(a).text().split(' ')[1].toLowerCase();

		if (link) links.push({ type, href: link, source });
	});

	return links;
};
