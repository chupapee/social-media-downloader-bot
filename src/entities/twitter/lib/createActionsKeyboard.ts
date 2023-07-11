import { InlineKeyboardButton } from 'typegram';

export const createActionsKeyboard = (
	actionsList: string[],
	ACTION_ID: string
) => {
	return actionsList.reduce(
		(acc: InlineKeyboardButton[][], text, i) => {
			if (i > 2) {
				acc[1].push({ text, callback_data: ACTION_ID });
				return acc;
			}
			acc[0].push({ text, callback_data: ACTION_ID });
			return acc;
		},
		[[], []]
	);
};
