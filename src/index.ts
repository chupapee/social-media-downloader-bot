import { Scenes, session, Telegraf } from 'telegraf';

import { onBotUp } from './features';
import { getScenesData } from './getScenesData';
import { feedbackScene } from './scenes/feedback';
import { instagramScene } from './scenes/instagram';
import { tiktokScene } from './scenes/tiktok';
import { twitterScene } from './scenes/twitter';
import { youtubeScene } from './scenes/youtube';
import { BOT_TOKEN, i18n, IContextBot } from './shared/config';

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
	console.log(error, 'INDEX.TS');
});

onBotUp();

bot.start(async (ctx) => {
	await ctx.reply(ctx.i18n.t('start', { userId: ctx.from.id }));
});

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

bot.on('message', async (ctx) => {
	const handleMessage = async () => {
		if ('text' in ctx.message) {
			const link = ctx.message.text;
			ctx.state.link = link;
			const scenesData = getScenesData();
			const selectedAction = scenesData.find(({ urls }) =>
				urls.some((url) => link.includes(url))
			);
			if (selectedAction) {
				const { scene, reply } = selectedAction;
				await ctx.reply(ctx.i18n.t(reply));
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
