import { InlineKeyboardButton } from 'typegram';

import { STATS_ACTION_ID } from '@shared/consts';

export const createActionsKeyboard = (actionsList: string[]) => {
	return actionsList.reduce(
		(acc: InlineKeyboardButton[][], text, i) => {
			const cbData = `${STATS_ACTION_ID}-${text}`;
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
