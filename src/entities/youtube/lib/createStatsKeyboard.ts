import { InlineKeyboardButton } from 'typegram';

import { STATS_ACTION_ID } from '@shared/consts';
import { compactNumber } from '@shared/utils';

interface CreateStatsKeyboardArgs {
	likes: number | null;
	dislikes: number | null;
	viewCount: string;
}

export const createStatsKeyboard = ({
	likes,
	dislikes,
	viewCount,
}: CreateStatsKeyboardArgs): InlineKeyboardButton[][] => {
	const stats = [];
	if (likes) stats.push(`👍 ${compactNumber.format(likes)}`);
	if (viewCount) stats.push(`👀 ${compactNumber.format(Number(viewCount))}`);
	if (dislikes) stats.push(`👎 ${compactNumber.format(dislikes)}`);
	return [
		stats.map((stat) => ({
			text: stat,
			callback_data: `${STATS_ACTION_ID}-${stat}`,
		})),
	];
};
