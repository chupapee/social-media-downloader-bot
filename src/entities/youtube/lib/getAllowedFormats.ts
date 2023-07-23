import { videoFormat } from 'ytdl-core';

import { calcLinkSize } from '@shared/utils';

interface VideoFormatWithMb extends videoFormat {
	mbBitrate: number | null;
}

/** Convert seconds to minutes */
const calcDuration = (sec: string) => {
	return Number((Number(sec) / 60).toFixed(0));
};

const addMbBitrate = async (
	formats: videoFormat[]
): Promise<VideoFormatWithMb[]> => {
	const links: VideoFormatWithMb[] = [];
	for (const format of formats) {
		const mbBitrate = await calcLinkSize(format.url, 'content-length');
		links.push({ ...format, mbBitrate });
	}
	return links;
};

const closestFormat = async (
	formats: VideoFormatWithMb[],
	goal: number
): Promise<VideoFormatWithMb> => {
	const videos = formats.filter(
		({ mimeType }) => !mimeType?.includes('audio')
	);
	return videos.reduce((prev, curr) =>
		Math.abs(curr.mbBitrate! - goal) < Math.abs(prev.mbBitrate! - goal)
			? curr
			: prev
	);
};

/** sizes in megabyte */
const MIN_SIZE = 3;
/** max size that telegram can upload */
const MAX_SIZE = 48;

export const getFormatToUpload = async (
	formats: videoFormat[],
	lengthSeconds: string
) => {
	const formatsWithMb = await addMbBitrate(formats);
	const duration = calcDuration(lengthSeconds);
	if (duration >= MAX_SIZE) {
		return null;
	}
	if (duration < 3) {
		return closestFormat(formatsWithMb, MIN_SIZE);
	}
	return closestFormat(formatsWithMb, duration);
};
