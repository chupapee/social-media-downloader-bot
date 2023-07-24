import axios from 'axios';

export const timeout = (sec: number): Promise<null> =>
	new Promise((ok) => setTimeout(ok, sec));

export const splitArray = <T>(arr: T[], size: number) => {
	const resultArray: T[][] = [];
	for (const [i, element] of arr.entries()) {
		if (i % size === 0) resultArray.push([]);
		resultArray[resultArray.length - 1].push(element);
	}
	return resultArray;
};

export const retryGettingPage = async <T>(
	maxAttempts = 3,
	link: string,
	getPage: (link: string) => Promise<T | null>,
	timeoutNum = 15_000
) => {
	let attemptsCount = 1;
	let content: T | null = null;
	while (!content && attemptsCount <= maxAttempts) {
		try {
			content = await Promise.race([timeout(timeoutNum), getPage(link)]);
		} catch (error) {
			console.error(error, 'puppeeter page preparing failed');
		}
		attemptsCount++;
	}

	return content;
};

export const downloadLink = async (link: string) => {
	try {
		const response = await axios.get(link, { responseType: 'arraybuffer' });
		const buffer = Buffer.from(response.data, 'binary');
		return buffer;
	} catch (error) {
		if (error instanceof Error) throw new Error(error.message);
		console.error('Download buffer error:', error);
	}
};

export const markdownParsable = (str: string) => {
	const symbolsToEscape = [
		'_',
		'-',
		'=',
		'*',
		'.',
		'`',
		'~',
		'>',
		'#',
		'+',
		'!',
		'|',
		'[',
		']',
		'(',
		')',
		'{',
		'}',
	];
	let result = str;

	for (const symbol of symbolsToEscape) {
		const escapedSymbol = symbol.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
		result = result.replace(new RegExp(escapedSymbol, 'g'), `\\${symbol}`);
	}
	return result;
};

export const bytesToMegaBytes = (bytes: number) =>
	Number((bytes / (1024 * 1024)).toFixed(1));

export const calcLinkSize = async (url: string, header = 'Content-Length') => {
	const res = await axios.head(url);
	if (!(header in res.headers || !Number.isNaN(Number(res.headers[header]))))
		return null;
	return bytesToMegaBytes(Number(res.headers[header]));
};

export const findLargestBelow = (arr: number[], max: number) => {
	return Math.max(...arr.filter((x) => x <= max));
};

export const compactNumber = Intl.NumberFormat('en', { notation: 'compact' });

export const uniqueList = <T>(arr: T[], key: keyof T) => {
	return [...new Map(arr.map((item) => [item[key], item])).values()];
};
