import { Scenes } from 'telegraf';
import { splitArray } from '../utils/utils';
import { IContextBot } from '../context.interface';

import { getPage, parseLinks } from './instagram.service';
import { isLinkAction } from './checkers';
import { endInteraction, startInteraction } from '../stats.helper';

export const INSTA_SCENE = 'insta_scene';
export const instaScene = new Scenes.BaseScene<IContextBot>(INSTA_SCENE);

const ErrMsg = '❌ Что-то пошло не так, попробуйте заново.';

instaScene.enter(async (ctx) => {
    const handelEnter = async () => {
        const link = ctx.state.link;

        try {
            const page = await getPage(link);
            const links = parseLinks(page);

            if ('message' in ctx.update) {
                const currentId = ctx.update.message.from.id;
                const allUsersExceptCurrent = ctx.session.data?.filter(({ userId }) => userId !== currentId) ?? [];
                const currentUser = { userId: currentId, instaLinks: [...links] };
                ctx.session.data = [...allUsersExceptCurrent, currentUser];

                startInteraction(ctx.update.message.from, 'insta');
            }

            if (links.length > 0) {
                if (links.length > 1) {
                    const buttons = links.map((l, i) => [
                        {
                            text: (i + 1).toString(),
                            callback_data: `download@${i}`,
                        },
                    ]);
                    // FIXME: more than 10 media files doesn't sending
                    if (links.length < 11) buttons.push([{ text: '⭐️ Скачать все', callback_data: `download@All` }]);

                    await ctx.reply('🔗 Ссылка содержит несколько медиа файлов, выберите какой хотите скачать:', {
                        reply_markup: { inline_keyboard: buttons },
                    });
                } else {
                    await ctx.reply('⭐️ Ссылка успешно обработана! Нажмите чтобы скачать:', {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    ...links.map((l, i) => ({
                                        text: '⚡️ ' + (i + 1),
                                        callback_data: `download@${i}`,
                                    })),
                                ],
                            ],
                        },
                    });
                }
            } else throw new Error();
        } catch (error) {
            console.log(error);
            await ctx.reply(ErrMsg);
        }
    };

    handelEnter();
});


instaScene.action(isLinkAction, async (ctx) => {
    const handelAction = async () => {
        const currentId = ctx.update.callback_query.from.id;
        const link = ctx.session.data.find((u) => +u.userId === +currentId)?.instaLinkOne ?? '';
        await ctx.answerCbQuery();
        try {
            await ctx.reply('⏳ Загружаем в телеграм...');
            if (link === 'All') {
                const allLinks = ctx.session?.data?.find((u) => +u.userId === +currentId)?.instaLinks;

                if (allLinks?.length) {
                    const limitedLinks = splitArray(allLinks, 5);

                    for (const list of limitedLinks) {
                        ctx.replyWithMediaGroup(list.map(({ href, type }) => ({ media: { url: href! }, type: type as 'photo' | 'video' })));
                        await new Promise(ok => setTimeout(ok, 3000));
                        console.log('timeout');
                    }
                }
            } else {
                if (typeof link === 'object') {
                    switch (link.type) {
                        case 'photo':
                            await ctx.replyWithPhoto({url: link.href!});
                            break;
                        case 'video':
                            await ctx.replyWithVideo(link.href!);
                            break;
                    }
                }
            }
        } catch (error) {
            await ctx.reply(ErrMsg);
            console.log(error);
        }

        endInteraction(ctx.update.callback_query.from, 'insta');
    };

    handelAction();
});
