import { Markup, Scenes } from 'telegraf';
import * as cheerio from 'cheerio';
import { IContextBot } from './context.interface';

import { isUploadAction, parseForQuality, preparePage } from './helpers';

export const uploadTweetScene = new Scenes.BaseScene<IContextBot>('uploadTweetScene');

uploadTweetScene.enter(async (ctx) => {
    const tweetLink = ctx.state.link;

    if('message' in ctx.update && ctx.update.message.from.id === 1333220153) {
        await ctx.reply(`🔄 ${ctx.state.count + 1} попытка`);
    }

    try {
        const content = await Promise.race([
            new Promise((ok) => setTimeout(ok, 10000)),
            preparePage(tweetLink)
        ]);
        if(!content) throw new Error();

        const $ = cheerio.load(content as string);
        const hasLinks = $('.download_link').length;

        if(hasLinks) {
            const qualities = parseForQuality(content as string);
            if('message' in ctx.update) {
                ctx.session.data = [{ userId: ctx.update.message.from.id, links: [...qualities] }];
            }
            await ctx.reply(
                '🎥 Выберите разрешение:',
                {
                    reply_markup: {
                        inline_keyboard: qualities.map(({quality}) => ([{text: quality, callback_data: `download@${quality}`}]))
                    }
                }
                );
        } else {
            await ctx.reply('🚫 Поддерживаются ссылки только на видео!');
            await ctx.scene.leave();
        }
    } catch (error) {
        console.log(error);
        if(ctx.state.count < 10) {
            ctx.state.count++;
            return ctx.scene.reenter();
        }
        console.log(error, 'error message');
        await ctx.reply('❌ Что-то пошло не так, попробуйте ещё раз');
    }
});

uploadTweetScene.action(isUploadAction, async (ctx) => {
    await ctx.answerCbQuery();
    const link = await ctx.state.link;
    const quality = await ctx.state.quality;
    // await ctx.reply(`Разрешение: ${quality}\nНажмите на ссылку, чтобы скачать видео:\n\n${link}`, { parse_mode: 'Markdown' });
    await ctx.replyWithHTML(`🎥 Разрешение: ${quality}\n📝 Перейдите по ссылке, чтобы скачать видео:\n\n`, Markup.inlineKeyboard([Markup.button.url('Перейти 🔗', link)]));
    Markup.button.url('link', link);
});