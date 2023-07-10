import * as cheerio from 'cheerio';

import { markdownParsable } from '../../../utils';
import { InstagramLink } from '../model';

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
				source: markdownParsable(source),
			});
	});

	return links;
};
