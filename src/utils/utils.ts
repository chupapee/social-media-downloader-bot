export const timeout = (sec: number): Promise<null> => new Promise((ok) => setTimeout(ok, sec));

export const splitArray = <T>(arr: T[], size: number) => {
    const resultArray: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
        if (i % size === 0) resultArray.push([]);
        resultArray[resultArray.length - 1].push(arr[i]);
    }
    return resultArray;
};
