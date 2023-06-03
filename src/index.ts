import { Scenes, session, Telegraf } from 'telegraf';
import { IContextBot } from './config/context.interface';
import { ConfigService } from './config/config.service';
import './config/firebase.config';

import { uploadVideoScene, UPLOAD_VIDEO_SCENE } from './twitter/scene';
import { instaScene, INSTA_SCENE } from './instagram/scene';
import { youScene, YOU_SCENE } from './youtube/scene';

const TWITTER_URL = 'twitter.com';
const INSTA_URL = 'instagram.com';
const YOU_URL = ['youtube.com', 'youtu.be'];

const token = new ConfigService().get('BOT_TOKEN');
const bot = new Telegraf<IContextBot>(token);

const stage = new Scenes.Stage<IContextBot>([
	uploadVideoScene,
	instaScene,
	youScene,
]);

bot.use(session());
bot.use(stage.middleware());

bot.catch((error) => {
	console.log(error, 'INDEX.TS');
});

bot.start(async (ctx) => {
	await ctx.reply('🔗 Отправьте ссылку');
});

const actionsByLink = [
	{
		urls: YOU_URL,
		reply: '🔄 Подготавливаем видео, это займёт не больше минуты',
		scene: YOU_SCENE,
	},
	{
		urls: [TWITTER_URL],
		reply: '🔄 Подготавливаем видео, это займёт не больше минуты',
		scene: UPLOAD_VIDEO_SCENE,
	},
	{
		urls: [INSTA_URL],
		reply: '🔄 Обработка ссылки, это займёт не больше минуты',
		scene: INSTA_SCENE,
	},
];

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
				await ctx.reply(reply);
				await ctx.scene.enter(scene);
			} else await ctx.reply('🚫 Отправьте корректную ссылку.');
		}
	};

	handleMessage();
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
