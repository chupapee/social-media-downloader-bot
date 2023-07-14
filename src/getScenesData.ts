import { instagramScene } from './scenes/instagram';
import { tiktokScene } from './scenes/tiktok';
import { twitterScene } from './scenes/twitter';
import { youtubeScene } from './scenes/youtube';

const TWITTER_URL = 'twitter.com';
const INSTAGRAM_URL = 'instagram.com';
const TIKTOK_URL = 'tiktok.com';
const YOUTUBE_URL = ['youtube.com', 'youtu.be'];

export const getScenesData = () => {
	return [
		{
			urls: YOUTUBE_URL,
			scene: youtubeScene.id,
		},
		{
			urls: [TWITTER_URL],
			scene: twitterScene.id,
		},
		{
			urls: [INSTAGRAM_URL],
			scene: instagramScene.id,
		},
		{
			urls: [TIKTOK_URL],
			scene: tiktokScene.id,
		},
	];
};
