import * as cheerio from 'cheerio';

import { TiktokLink } from './types';

export const parsePage = (page: string) => {
	const $ = cheerio.load(page);

	const link: TiktokLink = {} as TiktokLink;
	link.href = $('.download-file').first().attr('href');
	link.title = $('.video-title').next().text();

	return link;
};
