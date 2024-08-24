import { createEffect } from 'effector';
import { bot } from 'main';
import { UnknownError } from 'shared/api';
import { BOT_ADMIN_ID } from 'shared/config/config.service';

import { MessageData } from './services';

export const sendUnknownErrorMessageFx = createEffect(
	async ({
		messageData,
		unknownError,
	}: {
		messageData: MessageData;
		unknownError: UnknownError;
	}) => {
		console.log('unknown error occured:', messageData);

		notifyAdmin({
			messageData,
			status: 'error',
			errorInfo: { cause: unknownError },
		});

		await bot.telegram.sendMessage(
			messageData.chatId,
			"❌ Oops, something went wrong. Please try sending the link again.\nWe've already been notified about this and are working to fix it"
		);
	}
);

export async function notifyAdmin({
	messageData,
	status,
	errorInfo,
	baseInfo,
}: {
	messageData?: MessageData;
	status: 'start' | 'error' | 'info';
	errorInfo?: { cause: unknown };
	baseInfo?: string;
}) {
	if (messageData?.chatId === BOT_ADMIN_ID.toString()) return;

	const userInfo = JSON.stringify(
		{
			...(messageData?.user ?? {}),
			username: '@' + messageData?.user?.username,
		},
		null,
		2
	);

	const msgOptions = { link_preview_options: { is_disabled: true } };

	if (status === 'error' && errorInfo) {
		bot.telegram.sendMessage(
			BOT_ADMIN_ID,
			'🛑 ERROR OCCURED 🛑\n\n' +
				`🔗 Target link: ${messageData?.link}\n` +
				`reason: ${JSON.stringify(errorInfo.cause)}\n\n` +
				`👤 user : ${userInfo}`,
			msgOptions
		);
		return;
	}

	if (status === 'info' && baseInfo) {
		let text = baseInfo;
		if (messageData?.user) {
			text += '\n👤 user: ' + userInfo;
		}
		bot.telegram.sendMessage(BOT_ADMIN_ID, text, msgOptions);
		return;
	}

	if (status === 'start') {
		bot.telegram.sendMessage(
			BOT_ADMIN_ID,
			`👤 message started by: ${userInfo}\n\n${baseInfo}`,
			{
				...msgOptions,
				parse_mode: 'HTML',
			}
		);
	}
}
