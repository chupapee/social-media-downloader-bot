import { InlineKeyboardButton } from 'typegram';

import { instaScene } from './instagram/scene';
import { twitterScene } from './twitter/scene';
import { youScene } from './youtube/scene';

const TWITTER_URL = 'twitter.com';
const INSTA_URL = 'instagram.com';
const YOU_URL = ['youtube.com', 'youtu.be'];

export const getActionsByLink = () => {
	return [
		{
			urls: YOU_URL,
			reply: 'preparingVideo',
			scene: youScene.id,
		},
		{
			urls: [TWITTER_URL],
			reply: 'preparingVideo',
			scene: twitterScene.id,
		},
		{
			urls: [INSTA_URL],
			reply: 'preparingLink',
			scene: instaScene.id,
		},
	];
};

interface Link {
	href: string;
	quality: string;
}

export const createInlineKeyboard = (links: Link[], smallestLink?: Link) => {
	return links.reduce(
		(acc: InlineKeyboardButton[][], { href, quality }, index) => {
			const btn = { text: `🔗 ${quality}`, url: href };
			if (smallestLink?.quality && quality === smallestLink.quality) return acc;
			if (index % 2 === 0) {
				acc.push([btn]);
			} else {
				acc[acc.length - 1].push(btn);
			}
			return acc;
		},
		[]
	);
};
