import { User } from 'typegram';

import { bot } from '../index';
import { BOT_ADMIN_ID } from './config';

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
	const formattedLink = originalLink ? `\n\n🔗 Link:\n${originalLink}` : '';

	if (user) {
		const formattedUser = JSON.stringify(user, null, 2);
		bot.telegram.sendMessage(
			BOT_ADMIN_ID,
			`${text ?? ''}\n\n👤 User: ${formattedUser}${formattedLink}`,
			{ parse_mode: 'HTML' }
		);
		return;
	}

	bot.telegram.sendMessage(BOT_ADMIN_ID, text ?? '');
};
