import { InlineKeyboardButton } from 'typegram';

export const createActionsKeyboard = (actionsList: string[]) => {
	return actionsList.reduce(
		(acc: InlineKeyboardButton[][], text, i) => {
			const cbData = `tweetStats-${text}`;
			if (i > 2) {
				acc[1].push({ text, callback_data: cbData });
				return acc;
			}
			acc[0].push({ text, callback_data: cbData });
			return acc;
		},
		[[], []]
	);
};
