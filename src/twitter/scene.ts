import { Scenes } from 'telegraf';
import { IContextBot } from '../context.interface';
import { endInteraction, startInteraction } from '../stats.helper';
import { isUploadAction } from './checkers';
import { getLinks, parseForQuality } from './twitter.service';

export const UPLOAD_VIDEO_SCENE = 'uploadVideoScene';
export const uploadVideoScene = new Scenes.BaseScene<IContextBot>(UPLOAD_VIDEO_SCENE);

uploadVideoScene.enter(async (ctx) => {
    const handleEnter = async () => {
        const twitterLink = ctx.state.link;

        try {
            const content = await getLinks(twitterLink, ctx);
            if (!content) throw new Error();

            const qualities = parseForQuality(content as string);
            if ('message' in ctx.update) {
                const currentId = ctx.update.message.from.id;
                const allUsersExceptCurrent = ctx.session.data?.filter(({ userId }) => userId !== currentId) ?? [];
                const currentUser = { userId: currentId, twLinks: [...qualities], twLinkOne: '' };
                ctx.session.data = [...allUsersExceptCurrent, currentUser];

                startInteraction(ctx.update.message.from, 'twitter');
            }
            await ctx.reply('🎥 Выберите разрешение:', {
                reply_markup: {
                    inline_keyboard: qualities.map(({ quality }) => [
                        { text: quality, callback_data: `download@${quality}` },
                    ]),
                },
            });
        } catch (error) {
            console.log(error, 'error message');
            await ctx.reply('❌ Что-то пошло не так, попробуйте ещё раз');
        }
    };

    handleEnter();
});

uploadVideoScene.action(isUploadAction, async (ctx) => {
    const handleAction = async () => {
        await ctx.answerCbQuery();

        const currentId = ctx.update.callback_query.from.id;
        const link = ctx.session.data.find((u) => +u.userId === +currentId)?.twLinkOne ?? '';

        await ctx.editMessageText('⏳ Загружаем видео в телеграм...');
        await ctx.replyWithVideo({ url: link });

        endInteraction(ctx.update.callback_query.from, 'twitter');
    };

    handleAction();
});
