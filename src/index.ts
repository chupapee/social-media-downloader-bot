import { Markup, Scenes, session, Telegraf } from 'telegraf';

import { storageApi } from '@entities/storage';
import { addMsgToRemoveList } from '@features/bot';
import { isDonationTrigger, makeDonation } from '@features/donation';
import { feedbackScene } from '@scenes/feedback';
import { instagramScene } from '@scenes/instagram';
import { tiktokScene } from '@scenes/tiktok';
import { twitterScene } from '@scenes/twitter';
import { youtubeScene } from '@scenes/youtube';
import { BOT_TOKEN, i18n, IContextBot, isDevEnv } from '@shared/config';
import { STATS_ACTION_ID } from '@shared/consts';

import { botUpEvent } from './features/botUpEvent';
import { getScenesData } from './getScenesData';

export const bot = new Telegraf<IContextBot>(BOT_TOKEN);

const stage = new Scenes.Stage<IContextBot>([
	twitterScene,
	instagramScene,
	tiktokScene,
	youtubeScene,
	feedbackScene,
]);

bot.use(session());
bot.use(i18n.middleware());
bot.use(stage.middleware());

bot.catch((error) => {
	console.error(error, 'INDEX.TS');
});

botUpEvent();

const lang = {
	ru: '🇷🇺 Язык изменен на русский!',
	en: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Language changed to English!',
};

bot.command('ru', async (ctx) => {
	ctx.i18n.locale('ru');
	await ctx.reply(lang.ru);
});

bot.command('en', async (ctx) => {
	ctx.i18n.locale('en');
	await ctx.reply(lang.en);
});

bot.command('feedback', async (ctx) => {
	await ctx.scene.enter(feedbackScene.id);
});

bot.command('donate', makeDonation);

bot.use(async (ctx, next) => {
	if ('message' in ctx && 'text' in ctx.message!) {
		const text = ctx.message.text;
		if (isDonationTrigger(text)) {
			makeDonation(ctx);
		}
	}
	return next();
});

/** The response to the services stats inline_keyboard press is due to the fact that
 * after processing the link, the scene is exited,
 * so its needs to handle the button click here */
bot.use(async (ctx, next) => {
	try {
		if (
			'data' in ctx.callbackQuery! &&
			ctx.callbackQuery.data.includes(STATS_ACTION_ID)
		) {
			const text = ctx.callbackQuery.data.split('-')[1];
			await ctx.answerCbQuery(text);
		}
	} catch {}
	return next();
});

bot.use(async (ctx, next) => {
	const isStarted = ctx.state.isStarted;
	const isRunning = ctx.scene.current;

	if (
		'message' in ctx &&
		'text' in ctx.message! &&
		isDonationTrigger(ctx.message!.text)
	) {
		return;
	}
	/** While the user is in a certain scene,
	 * new commands are not processed */
	if (!isStarted && isRunning) {
		const { message_id } = await ctx.reply(ctx.i18n.t('pleaseWait'));
		addMsgToRemoveList(message_id, ctx);
		return;
	}
	return next();
});

bot.start(async (ctx) => {
	await ctx.reply(ctx.i18n.t('start', { userId: ctx.from.id }));
	storageApi.saveUser({ ...ctx.from });
});

bot.on('message', async (ctx) => {
	const handleMessage = async () => {
		if ('text' in ctx.message) {
			const link = ctx.message.text;

			if (isDonationTrigger(link)) return;

			// if (
			// 	(!isDevEnv && link.includes('twitter.com')) ||
			// 	link.includes('x.com')
			// ) {
			// 	ctx.reply(ctx.i18n.t('Unavailable'), {
			// 		parse_mode: 'Markdown',
			// 	});
			// 	return;
			// }

			const isMusicLink = link.includes('music.youtube.com');
			const scenesData = getScenesData();
			const selectedAction = scenesData.find(({ urls }) =>
				urls.some((url) => link.includes(url))
			);
			if (selectedAction && !isMusicLink) {
				ctx.state.link = link;
				ctx.state.isStarted = true;
				const { scene } = selectedAction;
				const { message_id } = await ctx.reply(
					ctx.i18n.t('processingLink'),
					Markup.keyboard([[ctx.i18n.t('supportBtnText')]]).resize()
				);
				addMsgToRemoveList(message_id, ctx);
				await ctx.scene.enter(scene);
			} else await ctx.reply(ctx.i18n.t('invalidLink'));
		}
	};
	handleMessage();
});

bot.launch({ dropPendingUpdates: true });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
