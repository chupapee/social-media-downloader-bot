import { Scenes, session, Telegraf } from 'telegraf';
import { IContextBot } from './context.interface';
import { ConfigService } from './config.service';

import { uploadTweetScene } from './uploadTweet.scene';

const token = new ConfigService().get('BOT_TOKEN');
const bot = new Telegraf<IContextBot>(token);

const stage = new Scenes.Stage<IContextBot>([uploadTweetScene]);

bot.use(session());
bot.use(stage.middleware());

bot.catch((err, ctx) => {
    console.log(err, 'INDEX.TS');
});

bot.start(async (ctx) => {
    await ctx.reply(
        '🔗 Отправьте ссылку',
    );
});

const isTweet = (link: string): boolean => {
    return link.startsWith('https://twitter.com/');
};


bot.on('message', async (ctx) => {
    if('text' in ctx.message && isTweet(ctx.message.text)) {
        await ctx.reply('🔄 Подгавливаем видео, это займёт не больше минуты');
        const link = ctx.message.text;
        ctx.state.link = link;
        ctx.state.count = 0;
        await ctx.scene.enter('uploadTweetScene');
    } else await ctx.reply('Отправьте корректную ссылку на твит.');
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));