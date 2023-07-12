import { TweetJson } from '../model';
import { parseMediaFiles } from './parseMediaFiles';
import { processMainTweet } from './processMainTweet';
import { processQuotedTweet } from './processQuotedTweet';

export const processTweetJson = (
	tweetJson: TweetJson,
	originalLink: string
) => {
	const { legacy } = tweetJson.data!.tweetResult.result;
	const mediaFiles = parseMediaFiles(legacy);

	const { mainTweet, actionsList } = processMainTweet(
		tweetJson,
		originalLink
	);

	let fullCaption = mainTweet;

	const { quoted_status_result } = tweetJson.data!.tweetResult.result;
	if (quoted_status_result?.result) {
		const quotedTweet = processQuotedTweet(tweetJson, originalLink);
		fullCaption += `\n\n<strong>↩️ Replying to </strong>${quotedTweet}`;
	}

	return {
		fullCaption,
		actionsBtn: actionsList,
		mediaFiles,
	};
};
