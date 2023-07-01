import axios from 'axios';
import { InlineKeyboardButton } from 'typegram';

export const downloadLink = async (link: string) => {
	try {
		const response = await axios.get(link, { responseType: 'arraybuffer' });
		const buffer = Buffer.from(response.data, 'binary');
		return buffer;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		console.error('Error while downloading and sending image:', error);
	}
};

interface Link {
	href: string;
	type: string;
}

export const createInlineKeyboard = (links: Link[]) => {
	return links.reduce(
		(acc: InlineKeyboardButton[][], { href, type }, index) => {
			const btn = { text: `${index + 1} ${type}`, url: href };
			if (index % 3 === 0) {
				acc.push([btn]);
			} else {
				acc[acc.length - 1].push(btn);
			}
			return acc;
		},
		[]
	);
};
