import { Scenes, session, Telegraf } from 'telegraf';
import { IContextBot } from './config/context.interface';
import { ConfigService } from './config/config.service';
import './config/firebase.config';

import { twitterScene } from './twitter/scene';
import { instaScene } from './instagram/scene';
import { youScene } from './youtube/scene';
import { actionsByLink } from './helpers';
import { i18n } from './config/i18n';
import { getUsers, updateBotWokeCount } from './statsDb/stats.helper';
import { timeout } from './utils/utils';

const PROD_BOT_TOKEN = 'PROD_BOT_TOKEN';
const DEV_BOT_TOKEN = 'DEV_BOT_TOKEN';
const DEV_VAL = 'development';
const envMode = process.env.NODE_ENV;

const BOT_TOKEN_KEY = envMode === DEV_VAL ? DEV_BOT_TOKEN : PROD_BOT_TOKEN;

const token = new ConfigService().get(BOT_TOKEN_KEY);
const bot = new Telegraf<IContextBot>(token);

const stage = new Scenes.Stage<IContextBot>([
	twitterScene,
	instaScene,
	youScene,
]);

bot.use(session());
bot.use(i18n.middleware());
bot.use(stage.middleware());

bot.catch((error) => {
	console.log(error, 'INDEX.TS');
});

const wakeUpMsg = async () => {
	try {
		const dbUsers = await getUsers();
		await timeout(500);
		if (dbUsers?.socialBotWokeCount === 0) {
			const users = [
				...dbUsers?.insta,
				...dbUsers?.twitter,
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
			updateBotWokeCount(dbUsers.socialBotWokeCount + 1);
		}
	} catch (error) {
		console.log('here');
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

bot.on('message', async (ctx) => {
	const handleMessage = async () => {
		if ('text' in ctx.message) {
			const link = ctx.message.text;
			ctx.state.link = link;
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
