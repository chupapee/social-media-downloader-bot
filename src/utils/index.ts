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

export const retryGettingPage = async (
	maxAttempts = 3,
	link: string,
	getPage: (link: string) => Promise<string>,
	timeoutNum = 15_000
) => {
	let attemptsCount = 1;
	let content: string | null = null;
	while (!content && attemptsCount <= maxAttempts) {
		try {
			content = await Promise.race([timeout(timeoutNum), getPage(link)]);
		} catch (error) {
			console.log(error, 'puppeeter page preparing failed');
		}
		attemptsCount++;
	}

	return content;
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
