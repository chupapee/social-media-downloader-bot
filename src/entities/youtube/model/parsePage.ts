import * as cheerio from 'cheerio';

import { YouTubeLink } from './types';

const uniqueList = <T>(arr: T[], key: keyof T) => {
	return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const parsePage = (page: string) => {
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
