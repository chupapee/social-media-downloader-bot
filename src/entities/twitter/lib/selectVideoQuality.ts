import { bytesToMegaBytes, findLargestBelow } from '../../../shared/utils';
import { TweetVideo } from '../model';

export const selectLargestQuality = (
	tweetVideo: TweetVideo,
	maxSize = 1000
) => {
	const allQualities = tweetVideo.variants.filter(
		({ content_type }) => content_type === 'video/mp4'
	);
	const revertedToMb = allQualities.map((video) => ({
		...video,
		bitrate: bytesToMegaBytes(video.bitrate),
	}));

	const sizes = revertedToMb.map(({ bitrate }) => bitrate);

	const largestVideo = findLargestBelow(sizes, maxSize);

	const largest = revertedToMb.find(
		({ bitrate }) => bitrate === largestVideo
	)!;

	return largest;
};
