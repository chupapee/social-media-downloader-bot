import * as cheerio from 'cheerio';

import { InstagramLink } from './types';

export const parsePage = (page: string) => {
	const $ = cheerio.load(page);
	const links: InstagramLink[] = [];

	const source = $('[alt="avatar"]').first().parent().text();

	$('[data-event="click_download_btn"]').each((_, a) => {
		const link = $(a).attr('href');
		const type = $(a).text().split(' ')[1].toLowerCase();

		if (link)
			links.push({
				type: type as 'photo' | 'video',
				href: link,
				source: `👤 ${source}`,
			});
	});

	return links;
};
