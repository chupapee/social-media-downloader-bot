import * as cheerio from 'cheerio';
import { calcLinkSize } from 'shared/utils';

import { YouTubeLink } from './types';

const uniqueList = <T>(arr: T[], key: keyof T) => {
	return [...new Map(arr.map((item) => [item[key], item])).values()];
};

export const parsePage = async (page: string) => {
	const $ = cheerio.load(page);

	const links: YouTubeLink[] = [];

	$('a.link-download').each((_, el) => {
		const title = $(el).attr('title') ?? '';

		const descr = $(el).attr('download') ?? '';
		const quality = $(el).attr('data-quality') ?? '';
		const href = $(el).attr('href') ?? '';

		const link = {
			title,
			descr: descr.replace('.mp4', ''),
			quality,
			href,
			size: null,
		};

		if (!link.title.includes('audio')) links.push(link);
	});

	const uniqueLinks = uniqueList(links, 'title');

	try {
		for (const link of uniqueLinks) {
			const size = await calcLinkSize(link.href, 'content-length');
			link.size = size;
		}
	} catch (error) {
		console.error(error);
	}

	if (uniqueLinks.length === 0) throw new Error('links not found');

	return uniqueLinks;
};
