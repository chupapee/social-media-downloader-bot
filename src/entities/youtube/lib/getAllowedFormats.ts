import { videoFormat } from 'ytdl-core';

import { calcLinkSize } from '@shared/utils';

/** size in megabytes */
const MAX_ALLOWED_MEDIA_SIZE = 50;
const TOO_LOW_QUALITY_SIZE = 5;

export const getAllowedFormats = async (
	formats: videoFormat[],
	isLongVideo: boolean
) => {
	const links: videoFormat[] = [];
	for (const format of formats) {
		const size = await calcLinkSize(format.url, 'content-length');
		const isVideo = !format.mimeType?.includes('audio');
		if (size && isVideo) {
			const isSizeAllowed = size <= MAX_ALLOWED_MEDIA_SIZE;
			/** Ignore too low qualities of long duration videos */
			if (isLongVideo && isSizeAllowed && size >= TOO_LOW_QUALITY_SIZE) {
				links.push(format);
				continue;
			}

			if (isSizeAllowed) {
				links.push(format);
			}
		}
	}

	let highestQualityLink = null;
	if (links.length > 0)
		highestQualityLink = links.sort((a, b) => b.bitrate! - a.bitrate!)[0];

	return { links, highestQualityLink };
};
