import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

import { YOUTUBE_PAGE_URL as PAGE_URL, YouTubeLink } from '../config';
import { puppeteerExecutablePath } from '../consts';
import { markdownParsable, timeout } from '../utils';

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

const uniqueList = <T>(arr: T[], key: keyof T) => {
	return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const parseLink = (page: string) => {
	const $ = cheerio.load(page);

	const links: YouTubeLink[] = [];

	$('a.link-download').each((_, el) => {
		const title = $(el).attr('title') ?? '';

		const descr = $(el).attr('download') ?? '';
		const quality = $(el).attr('data-quality') ?? '';
		const href = $(el).attr('href') ?? '';

		links.push({
			title,
			descr,
			quality,
			href,
		});
	});

	const filteredLinks = uniqueList(links, 'title').filter(
		({ title }) => !title?.includes('audio')
	);

	if (filteredLinks.length === 0) throw new Error('links not found');

	return filteredLinks;
};
