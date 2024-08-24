import { createEffect } from 'effector';
import { bot } from 'main';
import { BOT_ADMIN_ID } from 'shared/config/config.service';

import { MessageData } from './services';

export const sendErrorMessageFx = createEffect(
	async ({ messageData, text }: { messageData: MessageData; text: string }) => {
		console.log('error occured:', messageData);
		notifyAdmin({
			messageData,
			status: 'error',
			errorInfo: { cause: messageData },
		});
		bot.telegram.sendMessage(messageData.chatId, text, {
			parse_mode: 'Markdown',
			link_preview_options: { is_disabled: true },
		});
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
			'🛑 ERROR 🛑\n' +
				`🔗 Target link: ${messageData?.link}\n` +
				`reason: ${JSON.stringify(errorInfo.cause)}\n` +
				`author: ${userInfo}`,
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
