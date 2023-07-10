import { TweetInfo } from '../model';

export interface MediaFiles {
	href: string;
	type: 'photo' | 'video';
}

export const parseMediaFiles = (
	media: Pick<TweetInfo, 'extended_entities'>
) => {
	const mediaFiles: MediaFiles[] = [] as MediaFiles[];
	if (media?.extended_entities?.media) {
		media.extended_entities.media.forEach(
			({ media_url_https, video_info }) => {
				if (video_info?.variants) {
					mediaFiles.push({
						type: 'video',
						href: video_info?.variants[0].url, //** add the lowest quality */
					});
					return;
				}
				mediaFiles.push({ type: 'photo', href: media_url_https });
			}
		);
	}
	return mediaFiles;
};
