import { createEffect, createEvent, createStore, sample } from 'effector';
import { bot } from 'main';
import { sendErrorMessageFx } from 'modules/bot/controllers';
import { sendInstagramMedia } from 'modules/instagram/send-instagram-media';
import { saveUser } from 'modules/storage/storageApi';
import { sendTiktokMedia } from 'modules/tiktok/send-tiktok-media';
import { sendTwitterMedia } from 'modules/twitter/send-twitter-media';
import { sendYoutubeMedia } from 'modules/youtube/send-youtube-media';
import { and, delay, not, or } from 'patronum';
import { BOT_ADMIN_ID, isDevEnv } from 'shared/config/config.service';
import { SOURCE } from 'shared/utils';
import { User } from 'telegraf/typings/core/types/typegram';

export interface MessageData {
	chatId: string;
	link: string;
	linkSource: SOURCE;
	locale: string;
	user?: User;
	tempMessages?: number[];
	initTime: number;
}

const TIMEOUT_BETWEEN_REQUESTS = isDevEnv ? 0 : 120_000; // 2min;
export const $messageData = createStore<MessageData | null>(null);
export const $messagesList = createStore<MessageData[]>([]);
const $isLinkProcessing = createStore(false);
const $waitTime = createStore<Date | null>(null);

const checkMessages = createEvent();
export const tempMessageSent = createEvent<number>();

$messageData.on(tempMessageSent, (prev, newMsgId) => ({
	...prev!,
	tempMessages: [...(prev?.tempMessages ?? []), newMsgId],
}));

$messagesList.watch((messagesList) => console.log({ messagesList }));

export const messageDone = createEvent();
export const newMessageReceived = createEvent<MessageData>();

const messageStarted = createEvent();

const saveUserFx = createEffect(saveUser);

export const cleanUpTempMessagesFired = createEvent();

const cleanupTempMessagesFx = createEffect((message: MessageData) => {
	message.tempMessages?.forEach((id) => {
		bot.telegram.deleteMessage(message.chatId!, id);
	});
});

sample({
	clock: cleanUpTempMessagesFired,
	source: $messageData,
	filter: (message): message is MessageData => message !== null,
	target: cleanupTempMessagesFx,
});

$messageData.on(cleanupTempMessagesFx.done, (prev) => ({
	...prev!,
	tempMessages: [],
}));

interface SendWaitMessageFxArgs {
	multipleRequests: boolean;
	waitTime: Date | null;
	queueLength: number;
	newMessage: MessageData;
}

export const sendWaitMessageFx = createEffect(
	async ({
		multipleRequests,
		waitTime,
		queueLength,
		newMessage,
	}: SendWaitMessageFxArgs) => {
		if (multipleRequests) {
			await bot.telegram.sendMessage(
				newMessage.chatId,
				'⚠️ Only 1 link can be proceeded at once, please be patient'
			);
			return;
		}
		if (waitTime instanceof Date) {
			const endTime = waitTime.getTime() + TIMEOUT_BETWEEN_REQUESTS;
			const currTime = new Date().getTime();

			const diff = Math.abs(currTime - endTime);

			const seconds = Math.floor(diff / 1000);
			const minutes = Math.floor(seconds / 60);
			const remainingSeconds = seconds % 60;

			const timeToWait =
				minutes > 0
					? `${minutes} minute and ${remainingSeconds} seconds`
					: `${remainingSeconds} seconds`;

			await bot.telegram.sendMessage(
				newMessage.chatId,
				`⏳ Please wait ***${timeToWait}*** and send link again\n\nYou can get ***unlimited access*** to our bot without waiting any minutes between requests\nRun the ***/premium*** command to get more info`,
				{
					parse_mode: 'Markdown',
				}
			);
			return;
		}
		if (queueLength) {
			await bot.telegram.sendMessage(
				newMessage.chatId,
				`⏳ Please wait for your turn, there're ${queueLength} users before you!`
			);
		}
	}
);

$messagesList.on(newMessageReceived, (messagesList, newMessage) => {
	const alreadyExist = messagesList.some((x) => x.chatId === newMessage.chatId);
	const waitTime = $waitTime.getState();
	if (!alreadyExist && waitTime === null) return [...messagesList, newMessage];
	return messagesList;
});

$isLinkProcessing.on(messageStarted, () => true);
$isLinkProcessing.on(messageDone, () => false);
$messagesList.on(messageDone, (messagesList) => messagesList.slice(1));

sample({
	clock: [newMessageReceived, messageDone],
	target: checkMessages,
});

sample({
	clock: newMessageReceived,
	fn: (messageData: MessageData) => messageData.user!,
	target: saveUserFx,
});

sample({
	clock: newMessageReceived,
	source: {
		messageData: $messageData,
		waitTime: $waitTime,
		queue: $messagesList,
	},
	filter: or(
		$isLinkProcessing,
		$waitTime.map((x) => x instanceof Date)
	),
	fn: ({ messageData, waitTime, queue }, newMessage) => {
		return {
			multipleRequests: messageData?.chatId === newMessage.chatId,
			waitTime,
			queueLength: queue.length,
			newMessage,
		};
	},
	target: sendWaitMessageFx,
});

const messageInitiated = createEvent();

sample({
	clock: checkMessages,
	filter: and(
		not($isLinkProcessing),
		not($waitTime),
		$messagesList.map((messagesList) => messagesList.length > 0)
	),
	target: messageInitiated,
});

sample({
	clock: messageInitiated,
	source: $messagesList,
	fn: (messagesList) => messagesList[0],
	target: [$messageData, messageStarted],
});

sample({
	clock: messageStarted,
	source: $messageData,
	filter: (messageData: MessageData | null): messageData is MessageData =>
		messageData !== null && messageData.linkSource === 'instagram',
	target: sendInstagramMedia,
});

sample({
	clock: messageStarted,
	source: $messageData,
	filter: (messageData: MessageData | null): messageData is MessageData =>
		messageData !== null && messageData.linkSource === 'twitter',
	target: sendTwitterMedia,
});

sample({
	clock: messageStarted,
	source: $messageData,
	filter: (messageData: MessageData | null): messageData is MessageData =>
		messageData !== null && messageData.linkSource === 'tiktok',
	target: sendTiktokMedia,
});

sample({
	clock: messageStarted,
	source: $messageData,
	filter: (messageData: MessageData | null): messageData is MessageData =>
		messageData !== null && messageData.linkSource === 'youtube',
	target: sendYoutubeMedia,
});

sample({
	clock: messageInitiated,
	fn: () => new Date(),
	target: $waitTime,
});

sample({
	clock: delay(messageInitiated, TIMEOUT_BETWEEN_REQUESTS),
	fn: () => null,
	target: [$waitTime, checkMessages],
});

sample({
	clock: [
		sendInstagramMedia.done,
		sendTwitterMedia.done,
		sendTiktokMedia.done,
		sendYoutubeMedia.done,
	],
	source: $messageData,
	filter: (messageData, result) =>
		typeof result === 'string' && messageData?.chatId !== undefined,
	fn: (messageData, result) => ({
		messageData: messageData!,
		text: result as unknown as string,
	}), // FIXME: as string won't be necessary in ts 5.5
	target: [sendErrorMessageFx, messageDone],
});

sample({
	clock: [
		sendInstagramMedia.done,
		sendTwitterMedia.done,
		sendTiktokMedia.done,
		sendYoutubeMedia.done,
	],
	target: messageDone,
});

sample({
	clock: messageDone,
	source: $messageData,
	filter: (messageData): messageData is MessageData => messageData !== null,
	target: cleanupTempMessagesFx,
});

$messageData.on(messageDone, () => null);

/**
 * checking the message processing time
 * restart bot if it takes more than 7 minutes
 * Reason: downloading some stories leads to "file lives in another DC" error
 * TODO: have to find better way to handle this issue
 */
const MAX_WAIT_TIME = 7;
const intervalHasPassed = createEvent();
const checkMessageForRestart = createEffect(
	async (messageData: MessageData | null) => {
		if (messageData) {
			const minsFromStart = Math.floor(
				(Date.now() - messageData.initTime) / 60_000
			);
			console.log('minsFromStart', minsFromStart);

			if (minsFromStart === MAX_WAIT_TIME) {
				console.log(
					"Bot stopped manually, it's took too long to download stories"
				);
				await bot.telegram.sendMessage(
					BOT_ADMIN_ID,
					"❌ Bot stopped manually, it's took too long to download stories\n\n" +
						JSON.stringify(messageData, null, 2)
				);
				process.exit();
			}
		}
	}
);

sample({
	clock: intervalHasPassed,
	source: $messageData,
	target: checkMessageForRestart,
});

setInterval(intervalHasPassed, 30_000);
