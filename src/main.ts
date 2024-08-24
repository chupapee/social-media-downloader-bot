import { newMessageReceived, tempMessageSent } from 'modules/bot/services';
import { BOT_ADMIN_ID, BOT_TOKEN } from 'shared/config/config.service';
import {
	SUPABASE_API_KEY,
	SUPABASE_PROJECT_URL,
} from 'shared/config/supabase.config';
import { STATS_ACTION_ID } from 'shared/consts';
import { detectUrlSource } from 'shared/utils';
import { session, Telegraf } from 'telegraf';
import { callbackQuery, message } from 'telegraf/filters';

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_API_KEY);
export const bot = new Telegraf(BOT_TOKEN);

const RESTART_COMMAND = 'restart';

bot.use(session());

bot.catch((error) => {
	console.error(error, 'INDEX.TS');
});

bot.start(async (ctx) => {
	await ctx.reply('🔗 Please send a link');
});

/** The response to the services stats inline_keyboard press is due to the fact that
 * after processing the link, the scene is exited,
 * so its needs to handle the button click here */
bot.on(callbackQuery('data'), async (ctx, next) => {
	try {
		if (ctx.callbackQuery.data.includes(STATS_ACTION_ID)) {
			const text = ctx.callbackQuery.data.split('-')[1];
			await ctx.answerCbQuery(text);
		}
	} catch {}
	return next();
});

bot.on(message('text'), async (ctx) => {
	const handleMessage = async () => {
		if ('text' in ctx.message) {
			const link = ctx.message.text;

			const isMusicLink = link.includes('music.youtube.com');

			const targetSource = detectUrlSource(link);

			if (targetSource === 'twitter') {
				return ctx.reply(
					'⚠️ Twitter links are temporarily not processed, please stay tuned'
				);
			}

			if (targetSource && !isMusicLink) {
				const { message_id } = await ctx.reply('⏳ Fetching media...');

				newMessageReceived({
					chatId: String(ctx.chat.id),
					link,
					linkSource: targetSource,
					locale: '',
					user: ctx.from,
					initTime: Date.now(),
				});
				tempMessageSent(message_id);
				return;
			}

			// restart action
			if (
				ctx.from.id === BOT_ADMIN_ID &&
				ctx.message.text === RESTART_COMMAND
			) {
				ctx.reply('Are you sure?', {
					reply_markup: {
						inline_keyboard: [
							[{ text: 'Yes', callback_data: RESTART_COMMAND }],
						],
					},
				});
				return;
			}

			await ctx.reply('🚫 Please send a valid link');
		}
	};
	handleMessage();
});

bot.on(callbackQuery('data'), async (ctx) => {
	// restart action
	if (
		ctx.callbackQuery.data === RESTART_COMMAND &&
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		ctx?.from?.id === BOT_ADMIN_ID
	) {
		await ctx.answerCbQuery('⏳ Restarting...');
		process.exit();
	}
});

bot.launch({ dropPendingUpdates: true });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
