import { downloadLink } from '@shared/utils';

import { selectLargestQuality } from '../lib';
import { TweetInfo } from './index';

export interface MediaFile {
	href: string | Buffer;
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

				const buffer = await downloadLink(largestVideo.url).catch(
					(error) => {
						console.error(error);
					}
				);

				if (buffer) {
					mediaFiles.push({
						type: 'video',
						href: buffer,
					});
				}
				continue;
			}
			mediaFiles.push({ type: 'photo', href: media_url_https });
		}
	}
	return mediaFiles;
};
