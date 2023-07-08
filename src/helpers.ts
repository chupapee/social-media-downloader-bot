import { InlineKeyboardButton, User } from 'typegram';

import { BOT_AUTHOR_ID } from './config';
import { bot } from './index';
import { instaScene } from './instagram';
import { tiktokScene } from './tiktok';
import { twitterScene } from './twitter';
import { youScene } from './youtube';

const TWITTER_URL = 'twitter.com';
const INSTA_URL = 'instagram.com';
const TIKTOK_URL = 'tiktok.com';
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
		{
			urls: [TIKTOK_URL],
			reply: 'preparingVideo',
			scene: tiktokScene.id,
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
				const lastItem = acc[acc.length - 1];
				if (lastItem) lastItem.push(btn);
				else acc.push([btn]);
			}
			return acc;
		},
		[]
	);
};

interface MsgToSave {
	author?: User;
	link?: string;
	additional?: string;
}

export const sendToAuthor = (msg: MsgToSave, status: 'full' | 'short') => {
	const additional = msg.additional ? `\n\n${msg.additional}` : '';
	const link = msg.link ? `\n\n${msg.link}` : '';

	if (status === 'short') {
		bot.telegram.sendMessage(BOT_AUTHOR_ID, additional);
		return;
	}

	if (msg.author && msg.author.id !== BOT_AUTHOR_ID) {
		bot.telegram.sendMessage(
			BOT_AUTHOR_ID,
			`From: ${JSON.stringify(msg.author, null, 2)}${additional}${link}`
		);
	}
};
