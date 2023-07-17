import { selectLargestQuality } from '../lib';
import { TweetJson } from '.';
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
	if (extended_entities?.media) {
		links = extended_entities.media
			.map(({ media_url_https, video_info }, i) => {
				if (video_info?.variants) {
					const highestQuality = selectLargestQuality(video_info);
					return `<a href="${highestQuality.url}">🔗 ${
						i + 1
					}. Video</a>`;
				}
				return `<a href='${media_url_https}'>🔗 ${i + 1}. Photo</a>`;
			})
			.join('\n');
	}

	const quotedTweet = parseTweetText({
		originalLink,
		full_text: quotedFullText,
		name: quotedName,
		screen_name: quotedScreenName,
		linksText: links,
	});
	return quotedTweet;
};
