import { Scenes } from 'telegraf';
import { IContextBot } from '../config/context.interface';

import { retryGettingPage } from '../utils/utils';
import { endInteraction, startInteraction } from '../statsDb/stats.helper';

import { getPage, parseLink } from './you.service';
import { isUploadAction } from './checkers';

export const YOU_SCENE = 'you_scene';
export const youScene = new Scenes.BaseScene<IContextBot>(YOU_SCENE);

const ErrMsg = '❌ Что-то пошло не так, попробуйте заново.';

youScene.enter(async (ctx) => {
    const handleEnter = async () => {
        const pageLink = ctx.state.link;

        try {
            const page = await retryGettingPage(3, pageLink, getPage, 20_000);

            if ('message' in ctx.update && page) {
                const links = parseLink(page);
                if (links) {
                    const currentId = ctx.update.message.from.id;
                    const allUsersExceptCurrent =
                        ctx.session.data?.filter(({ userId }) => +userId !== +currentId) ?? [];
                    const currentUser = { userId: currentId, youLinks: links };

                    ctx.session.data = [...allUsersExceptCurrent, currentUser];

                    startInteraction(ctx.update.message.from, 'you');
                    await ctx.reply('🎥 Выберите разрешение:', {
                        reply_markup: {
                            inline_keyboard: links.map(({ title }) => [
                                { text: title!, callback_data: `download@${title}` },
                            ]),
                        },
                    });
                } else throw new Error(ErrMsg);
            } else throw new Error(ErrMsg);
        } catch (error) {
            console.log(error);
            await ctx.reply(ErrMsg);
        }
    };

    handleEnter();
});

youScene.action(isUploadAction, async (ctx) => {
    const handleAction = async () => {
        await ctx.answerCbQuery();

        const currentId = ctx.update.callback_query.from.id;
        const link = ctx.session.data.find((u) => +u.userId === +currentId)?.youLinkOne;

        if (link?.href) {
            await ctx.editMessageText('⏳ Загружаем видео в телеграм...');
            await ctx.replyWithVideo({ url: link.href }, { caption: link.descr });
        } else {
            await ctx.reply(ErrMsg);
        }

        endInteraction(ctx.update.callback_query.from, 'you');
    };

    handleAction();
});
