export const removeLastLink = (text: string) => {
	const regex = /https?:\/\/\S+/g;
	const matches = text.match(regex);

	if (matches && matches.length > 0) {
		const lastLink = matches[matches.length - 1];
		return text.replace(lastLink, '');
	}
	return text.replace(regex, '');
};

interface ParseTweetTextArgs {
	originalLink: string;
	full_text: string;
	screen_name: string;
	name?: string;
	linksText?: string;
}

export const parseTweetText = ({
	originalLink,
	full_text,
	screen_name,
	name,
	linksText,
}: ParseTweetTextArgs) => {
	const correctedText = removeLastLink(full_text);
	const text = correctedText.trim().length > 0 ? `\n\n${correctedText}` : '';
	const fullTweet = `<a href="${originalLink}">👤 ${
		name ?? screen_name
	}: </a>${text}${linksText ? `\n${linksText}` : ''}`;

	return fullTweet;
};
