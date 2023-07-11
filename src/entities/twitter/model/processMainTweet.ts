import { compactNumber } from '../../../shared/utils';
import { TweetInfo, TweetJson } from '../model';
import { parseMediaFiles } from './parseMediaFiles';
import { parseTweetText } from './parseTweetText';

interface CreateActionsListArgs extends TweetInfo {
	count: number;
}

const createActionsList = (args: CreateActionsListArgs) => {
	const {
		favorite_count,
		retweet_count,
		quote_count,
		count,
		bookmark_count,
	} = args;

	return [
		`❤️ ${compactNumber.format(favorite_count)}`,
		`🔁 ${compactNumber.format(retweet_count)}`,
		`🗣🔁 ${compactNumber.format(quote_count)}`,
		`👀 ${compactNumber.format(count)}`,
		`🔖 ${compactNumber.format(bookmark_count)}`,
	];
};

export const processMainTweet = (
	tweetJson: TweetJson,
	originalLink: string
) => {
	const { core, legacy, views } = tweetJson.data!.tweetResult.result;

	const { full_text } = legacy;

	const { count } = views;

	const { name, screen_name } = core.user_results.result.legacy;

	const actionsList = createActionsList({ ...legacy, count });

	const mainTweet = parseTweetText({
		originalLink,
		full_text,
		name,
		screen_name,
	});
	return { mainTweet, actionsList };
};
