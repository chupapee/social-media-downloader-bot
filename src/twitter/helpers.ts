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
