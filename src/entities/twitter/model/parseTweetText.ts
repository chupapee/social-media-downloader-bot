export const removeLastLink = (text: string) => {
	const regex = /https?:\/\/\S+/g;
	const matches = text.match(regex);

	if (matches && matches.length > 0) {
		const lastLink = matches[matches.length - 1];
		return text.replace(lastLink, '');
	}
	return text.replace(regex, '');
};

interface parseTweetTextArgs {
	originalLink: string;
	full_text: string;
	name?: string;
	screen_name: string;
	linksText: string;
}

export const parseTweetText = ({
	originalLink,
	full_text,
	name,
	screen_name,
	linksText,
}: parseTweetTextArgs) => {
	const text = `<a href="${originalLink}">👤 ${
		name ?? screen_name
	}: </a>\n\n${removeLastLink(full_text)}${
		linksText ? `\n${linksText}` : ''
	}`;

	return text;
};
