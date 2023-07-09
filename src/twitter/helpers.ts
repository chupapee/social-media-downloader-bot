const parseSize = (size: string): number => {
	const [width, height] = size.split('x').map(Number);
	return width * height;
};

export const getSmallestLink = (
	links: Record<'quality' | 'href', string>[]
) => {
	return links.reduce((smallest, current) => {
		const smallestSize = parseSize(smallest.quality);
		const currentSize = parseSize(current.quality);
		return smallestSize < currentSize ? smallest : current;
	});
};

export const removeLastLink = (text: string) => {
	const regex = /https?:\/\/\S+/g;
	const matches = text.match(regex);

	if (matches && matches.length > 0) {
		const lastLink = matches[matches.length - 1];
		return text.replace(lastLink, '');
	}
	return text.replace(regex, '');
};
