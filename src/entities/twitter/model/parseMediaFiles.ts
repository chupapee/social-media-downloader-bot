import { selectVideoQuality } from '../lib';
import { TweetInfo } from '../model';

export interface MediaFile {
	href: string;
	type: 'photo' | 'video';
}

export const parseMediaFiles = (
	media: Pick<TweetInfo, 'extended_entities'>
) => {
	const mediaFiles: MediaFile[] = [] as MediaFile[];
	if (media?.extended_entities?.media) {
		media.extended_entities.media.forEach(
			({ media_url_https, video_info }) => {
				if (video_info?.variants !== undefined) {
					const lowestQuality = selectVideoQuality(
						video_info,
						'lowest'
					);

					mediaFiles.push({
						type: 'video',
						href: lowestQuality.url,
					});
					return;
				}
				mediaFiles.push({ type: 'photo', href: media_url_https });
			}
		);
	}
	return mediaFiles;
};
