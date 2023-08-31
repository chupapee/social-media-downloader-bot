import { getUsers } from '@entities/storage/api/storageApi';
import { i18n } from '@shared/config';
import { timeout } from '@shared/utils';

import { bot } from '../index';
import { toggleBotUpFlag } from './storage/toggleBotUpFlag';

export const botUpEvent = async () => {
	try {
		const response = await getUsers();
		await timeout(500);

		if (response?.users && !response.socialBotUpFlag) {
			for (const user of response.users) {
				try {
					await bot.telegram.sendMessage(
						user.id as number,
						i18n.t(user.language_code ?? 'en', 'botUpText'),
						{ parse_mode: 'Markdown' }
					);
					await timeout(1000);
				} catch (error) {
					console.error(error, 'onBotUp error');
				}
			}
		}
		toggleBotUpFlag();
	} catch (error) {
		console.error(error, 'onBotUp error');
	}
};
