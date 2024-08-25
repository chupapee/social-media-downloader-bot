import { selectLargestQuality } from '../lib/selectVideoQuality';
import { MediaFile, TweetJson } from '.';
import { parseTweetText } from './parseTweetText';

export const processQuotedTweet = (
	tweetJson: TweetJson,
	originalLink: string
) => {
	const { quoted_status_result } = tweetJson.data!.tweetResult.result;
	const { core: quotedCore, legacy: quotedLegacy } =
		quoted_status_result!.result;
	const { name: quotedName, screen_name: quotedScreenName } =
		quotedCore.user_results.result.legacy;
	const { full_text: quotedFullText, extended_entities } = quotedLegacy;

	let links = '';
	const mediaFiles: MediaFile[] = [];

	if (extended_entities?.media) {
		links = extended_entities.media
			.map(({ media_url_https, video_info }, i) => {
				if (video_info?.variants) {
					const highestQuality = selectLargestQuality(video_info, 50);
					mediaFiles.push({
						href: highestQuality.url,
						type: 'video',
					});

					return `<a href="${highestQuality.url}">🔗 ${
						i + 1
					}. Quoted tweet video</a>`;
				}
				mediaFiles.push({ href: media_url_https, type: 'photo' });

				return `<a href='${media_url_https}'>🔗 ${
					i + 1
				}. Quoted tweet photo</a>`;
			})
			.join('\n');
	}

	const fullText = parseTweetText({
		originalLink,
		full_text: quotedFullText,
		name: quotedName,
		screen_name: quotedScreenName,
		linksText: links,
	});

	return { fullText, mediaFiles };
};
