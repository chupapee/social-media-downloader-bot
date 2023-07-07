import { Scenes } from 'telegraf';

import { IContextBot } from '../config';
import { sendToAuthor } from '../helpers';
import { statsModel } from '../statsDb';

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

			sendToAuthor(
				{
					author,
					additional: `✉️ Message:\n${message}`,
				},
				'full'
			);

			statsModel.sendFeedback({ author, message });
		}

		await ctx.reply(ctx.i18n.t('feedbackReceived'));
		ctx.scene.leave();
	};
	handleMessage();
});
