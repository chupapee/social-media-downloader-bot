import { INSTA_SCENE } from './instagram/scene';
import { TWITTER_SCENE } from './twitter/scene';
import { YOU_SCENE } from './youtube/scene';

const TWITTER_URL = 'twitter.com';
const INSTA_URL = 'instagram.com';
const YOU_URL = ['youtube.com', 'youtu.be'];

export const actionsByLink = [
	{
		urls: YOU_URL,
		reply: 'preparingVideo',
		scene: YOU_SCENE,
	},
	{
		urls: [TWITTER_URL],
		reply: 'preparingVideo',
		scene: TWITTER_SCENE,
	},
	{
		urls: [INSTA_URL],
		reply: 'preparingLink',
		scene: INSTA_SCENE,
	},
];

export const puppeteerExecutablePath = process.env.NODE_ENV === 'development' ? '' : '/usr/bin/google-chrome';
