export const timeout = (sec: number): Promise<null> => new Promise((ok) => setTimeout(ok, sec));

export const splitArray = <T>(arr: T[], size: number) => {
    const resultArray: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
        if (i % size === 0) resultArray.push([]);
        resultArray[resultArray.length - 1].push(arr[i]);
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
            console.log('prepare failed');
        }
        attemptsCount++;
    }

    return content;
};
