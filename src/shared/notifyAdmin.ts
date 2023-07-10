import { User } from 'typegram';

import { BOT_ADMIN_ID, BOT_AUTHOR_ID } from '../config';
import { bot } from '../index';

interface NotifyAdminFullArgs {
	user?: User;
	originalLink?: string;
	text?: string;
}

export const notifyAdmin = ({
	user,
	originalLink,
	text,
}: NotifyAdminFullArgs) => {
	const formattedText = text ? `\n\n${text}` : '';
	const formattedLink = originalLink ? `\n\n${originalLink}` : '';

	if (user) {
		const formattedUser = JSON.stringify(user, null, 2);
		bot.telegram.sendMessage(
			BOT_AUTHOR_ID,
			`From: ${formattedUser}${formattedText}${formattedLink}`
		);
		return;
	}

	bot.telegram.sendMessage(BOT_ADMIN_ID, formattedText);
};
