import { Scenes, session, Telegraf } from 'telegraf';

import { BOT_TOKEN, i18n, IContextBot } from './config';
import { feedbackScene } from './feedback';
import { getActionsByLink } from './helpers';
import { instaScene } from './instagram';
import { statsModel } from './statsDb';
import { tiktokScene } from './tiktok';
import { twitterScene } from './twitter';
import { timeout } from './utils';
import { youScene } from './youtube';

export const bot = new Telegraf<IContextBot>(BOT_TOKEN);

const stage = new Scenes.Stage<IContextBot>([
	twitterScene,
	instaScene,
	tiktokScene,
	youScene,
	feedbackScene,
]);

bot.use(session());
bot.use(i18n.middleware());
bot.use(stage.middleware());

bot.catch((error) => {
	console.log(error, 'INDEX.TS');
});

const wakeUpMsg = async () => {
	try {
		const dbUsers = await statsModel.getUsers();
		await timeout(500);
		if (dbUsers?.socialBotWokeCount === 0) {
			const users = [
				...dbUsers?.insta,
				...dbUsers?.twitter,
				...dbUsers?.tiktok,
				...dbUsers?.you,
			].filter((v, i, a) => a.findIndex((v2) => v2.id === v.id) === i); // unique users only;

			for (const user of users) {
				try {
					await bot.telegram.sendMessage(
						user.id as number,
						i18n.t(user.language_code ?? 'en', 'botWokeUp'),
						{ parse_mode: 'Markdown' }
					);
					await timeout(500);
				} catch (error) {
					console.log(error, 'here');
				}
			}
			statsModel.updateBotWokeCount(dbUsers.socialBotWokeCount + 1);
		}
	} catch (error) {
		console.log(error, 'wakeUp error');
	}
};

wakeUpMsg();

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
			const actionsByLink = getActionsByLink();
			const selectedAction = actionsByLink.find(({ urls }) =>
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
