import { selectLargestQuality } from '../lib';
import { TweetInfo } from '.';

export interface MediaFile {
	href: string;
	type: 'photo' | 'video';
}

const MAX_ALLOWED_SIZE = 50; // megabyte

export const parseMediaFiles = (
	media: Pick<TweetInfo, 'extended_entities'>
) => {
	const mediaFiles: MediaFile[] = [] as MediaFile[];
	if (media.extended_entities?.media) {
		media.extended_entities.media.forEach(
			({ media_url_https, video_info }) => {
				if (video_info?.variants !== undefined) {
					const largestVideo = selectLargestQuality(
						video_info,
						MAX_ALLOWED_SIZE
					);

					mediaFiles.push({
						type: 'video',
						href: largestVideo.url,
					});
					return;
				}
				mediaFiles.push({ type: 'photo', href: media_url_https });
			}
		);
	}
	return mediaFiles;
};
