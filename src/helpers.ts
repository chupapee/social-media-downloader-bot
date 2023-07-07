import { InlineKeyboardButton, User } from 'typegram';

import { ConfigService } from './config/config.service';
import { AUTHOR_ID } from './consts';
import { bot } from './index';
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

export const markdownParsable = (str: string) => {
	const symbolsToEscape = [
		'_',
		'-',
		'=',
		'*',
		'.',
		'`',
		'~',
		'>',
		'#',
		'+',
		'!',
		'|',
		'[',
		']',
		'(',
		')',
		'{',
		'}',
	];
	let result = str;

	for (const symbol of symbolsToEscape) {
		const escapedSymbol = symbol.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
		result = result.replace(new RegExp(escapedSymbol, 'g'), `\\${symbol}`);
	}
	return result;
};

interface MsgToSave {
	author: User;
	scene: 'Insta' | 'Twitter' | 'Youtube' | 'Feedback';
	link?: string;
	additional?: string;
}

export const sendToAuthor = (msg: MsgToSave) => {
	const additional = msg.additional ? `\n\n${msg.additional}` : '';
	const link = msg.link ? `\n\nLink:\n${msg.link}` : '';

	if (AUTHOR_ID)
		bot.telegram.sendMessage(
			AUTHOR_ID,
			`Scene: ${msg.scene}\n\nFrom: ${JSON.stringify(
				msg.author,
				null,
				2
			)}${additional}${link}`
		);
};
