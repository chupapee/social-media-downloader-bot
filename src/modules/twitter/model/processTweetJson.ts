import { TweetJson } from './index';
import { MediaFile, parseMediaFiles } from './parseMediaFiles';
import { processMainTweet } from './processMainTweet';
import { processQuotedTweet } from './processQuotedTweet';

export const processTweetJson = async (
	tweetJson: TweetJson,
	originalLink: string
) => {
	const { legacy } = tweetJson.data!.tweetResult.result;
	const mediaFiles = await parseMediaFiles(legacy);
	const quotedTweetMediaFiles: MediaFile[] = [];

	const { mainTweet, actionsList } = processMainTweet(tweetJson, originalLink);

	let fullCaption = mainTweet;

	const { quoted_status_result } = tweetJson.data!.tweetResult.result;
	if (quoted_status_result?.result) {
		const { fullText, mediaFiles = [] } = processQuotedTweet(
			tweetJson,
			originalLink
		);
		quotedTweetMediaFiles.push(...mediaFiles);
		fullCaption += `\n\n<strong>↩️ Replying to </strong>${fullText}`;
	}

	return {
		fullCaption,
		actionsBtn: actionsList,
		mediaFiles: { mainTweet: mediaFiles, quotedTweet: quotedTweetMediaFiles },
		quotedTweetMediaFiles,
	};
};
