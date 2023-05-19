import { Scenes, session, Telegraf } from 'telegraf';
import { IContextBot } from './context.interface';
import { ConfigService } from './config.service';

import { uploadVideoScene, UPLOAD_VIDEO_SCENE } from './uploadTwit.scene';
const TWITTER_URL = 'https://twitter.com/';

const token = new ConfigService().get('BOT_TOKEN');
const bot = new Telegraf<IContextBot>(token);

const stage = new Scenes.Stage<IContextBot>([uploadVideoScene]);

bot.use(session());
bot.use(stage.middleware());

// permissions
// bot.use(async (ctx, next)=> {
//     if("message" in ctx.update) {
//         const userId = ctx.update.message.from.id;
//         const hasPermission = userId === 1333220153;
//         if(!hasPermission) {
//             await ctx.reply('Для получения доступа, напиши автору бота: @chupapee');
//             return;
//         }
//         return next();
//     }
// });

bot.catch((err, ctx) => {
    console.log(err, 'INDEX.TS');
});

bot.start(async (ctx) => {
    await ctx.reply(
        '🔗 Отправьте ссылку',
    );
});

const isTwitterVideo = (link: string): boolean => {
    return link.startsWith(TWITTER_URL);
};

bot.on('message', async (ctx) => {
    const handleMessage = async () => {
        if('text' in ctx.message && isTwitterVideo(ctx.message.text)) {
            await ctx.reply('Подготавливаем видео, это займёт не больше минуты 🔄');
            const link = ctx.message.text;
            ctx.state.link = link;
            await ctx.scene.enter(UPLOAD_VIDEO_SCENE);
        } else await ctx.reply('🚫 Отправьте корректную ссылку на твит.');
    };

    handleMessage();
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));