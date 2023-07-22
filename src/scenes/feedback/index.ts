import { Scenes } from 'telegraf';

import { saveFeedback } from '@features/storage';
import { IContextBot } from '@shared/config';
import { notifyAdmin } from '@shared/notifyAdmin';

const FEEDBACK_SCENE = 'feedbackScene';
export const feedbackScene = new Scenes.BaseScene<IContextBot>(FEEDBACK_SCENE);

feedbackScene.enter(async (ctx) => {
	await ctx.reply(ctx.i18n.t('feedbackExample'));
});

feedbackScene.on('message', (ctx) => {
	const handleMessage = async () => {
		if ('text' in ctx.message) {
			const message = ctx.message.text;
			const author = ctx.update.message.from;
			notifyAdmin({ user: author, text: `✉️ Feedback:\n${message}` });
			saveFeedback({ author, message });
		}

		await ctx.reply(ctx.i18n.t('feedbackReceived'));
		ctx.scene.leave();
	};
	handleMessage();
});
