import { Scenes } from 'telegraf';
import * as cheerio from 'cheerio';
import { IContextBot } from './context.interface';

import { getLinks, isUploadAction, parseForQuality } from './helpers';

export const UPLOAD_VIDEO_SCENE = 'uploadVideoScene';
export const uploadVideoScene = new Scenes.BaseScene<IContextBot>(UPLOAD_VIDEO_SCENE);

uploadVideoScene.enter(async (ctx) => {
    const twitterLink = ctx.state.link;

    try {
        const content = await getLinks(twitterLink, ctx);
        if(!content) throw new Error();

        const $ = cheerio.load(content as string);
        const hasLinks = $('.download_link').length;

        if(hasLinks) {
            const qualities = parseForQuality(content as string);
            if('message' in ctx.update) {
                const currentId = ctx.update.message.from.id;
                const allUsersExceptCurrent = ctx.session.data?.filter(({ userId }) => userId === currentId) ?? [];
                const currentUser = { userId: currentId, links: [...qualities], link: '' };
                ctx.session.data = [...allUsersExceptCurrent, currentUser];
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
        console.log(error, 'error message');
        await ctx.reply('❌ Что-то пошло не так, попробуйте ещё раз');
    }
});

// const videoCaption = '📥 @awesome_twitter_downloader_bot';
const videoCaption = '';

uploadVideoScene.action(isUploadAction, async (ctx) => {
    await ctx.answerCbQuery();

    const currentId = ctx.update.callback_query.from.id;
    const link = ctx.session.data.find((u) => +u.userId === +currentId)?.link ?? '';

    await ctx.reply('⌛️ Загружаем видео в телеграм...');
    await ctx.replyWithVideo({ url: link }, { caption: videoCaption });
});