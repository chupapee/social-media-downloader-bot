import { TweetVideo } from '../model';

export const selectVideoQuality = (
	tweetVideo: TweetVideo,
	quality: 'highest' | 'lowest'
) => {
	const allQualities = tweetVideo.variants.filter(
		({ content_type }) => content_type === 'video/mp4'
	);
	const selectedQuality = allQualities.reduce((prev, curr) => {
		const highQ = prev.bitrate > curr.bitrate ? prev : curr;
		const lowQ = prev.bitrate < curr.bitrate ? prev : curr;
		return quality === 'highest' ? highQ : lowQ;
	});
	return selectedQuality;
};
