import { downloadLink, timeout } from '@shared/utils';

import { selectLargestQuality } from '../lib';
import { TweetInfo } from './index';

export interface MediaFile {
	href: Buffer;
	type: 'photo' | 'video';
}

const MAX_ALLOWED_MEDIA_SIZE = 50; // mb

export const parseMediaFiles = async (
	media: Pick<TweetInfo, 'extended_entities'>
) => {
	const mediaFiles: MediaFile[] = [];
	if (media.extended_entities?.media) {
		for (const { media_url_https, video_info } of media.extended_entities
			.media) {
			if (video_info?.variants !== undefined) {
				const largestVideo = selectLargestQuality(
					video_info,
					MAX_ALLOWED_MEDIA_SIZE
				);

				try {
					const videoBuffer = await Promise.race([
						downloadLink(largestVideo.url),
						timeout(5_000),
					]);
					if (videoBuffer) {
						mediaFiles.push({
							type: 'video',
							href: videoBuffer,
						});
					}
				} catch (error) {}
				return;
			}
			try {
				const photoBuffer = await Promise.race([
					downloadLink(media_url_https),
					timeout(5_000),
				]);
				if (photoBuffer) {
					mediaFiles.push({ type: 'photo', href: photoBuffer });
				}
			} catch (error) {}
		}
	}
	return mediaFiles;
};
