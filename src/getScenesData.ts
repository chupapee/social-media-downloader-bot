import { instagramScene } from './scenes/instagram';
import { tiktokScene } from './scenes/tiktok';
import { twitterScene } from './scenes/twitter';
import { youtubeScene } from './scenes/youtube';

const TWITTER_URL = 'twitter.com';
const INSTA_URL = 'instagram.com';
const TIKTOK_URL = 'tiktok.com';
const YOU_URL = ['youtube.com', 'youtu.be'];

export const getScenesData = () => {
	return [
		{
			urls: YOU_URL,
			reply: 'preparingVideo',
			scene: youtubeScene.id,
		},
		{
			urls: [TWITTER_URL],
			reply: 'preparingVideo',
			scene: twitterScene.id,
		},
		{
			urls: [INSTA_URL],
			reply: 'preparingLink',
			scene: instagramScene.id,
		},
		{
			urls: [TIKTOK_URL],
			reply: 'preparingVideo',
			scene: tiktokScene.id,
		},
	];
};
