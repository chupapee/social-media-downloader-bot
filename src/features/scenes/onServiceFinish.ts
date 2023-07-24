import { SocialMedia } from '@entities/storage';
import { BOT_ADMIN_ID, IContextBot } from '@shared/config';
import { notifyAdmin } from '@shared/notifyAdmin';

import { removeTempMessages } from '../bot';

interface OnServiceInitArgs {
	ctx: IContextBot;
	socialMediaType: SocialMedia;
	status: 'success' | 'error';
	error?: Error;
	originalLink: string;
}

export const onServiceFinish = ({
	ctx,
	socialMediaType,
	status,
	error,
	originalLink,
}: OnServiceInitArgs) => {
	const successText = `${socialMediaType} service handled! ✅`;
	const errorText = `❌ ${socialMediaType} service failed!\n\n🔗 Link:\n${originalLink}`;
	if ('message' in ctx.update) {
		const user = ctx.update.message.from;
		if (user.id !== BOT_ADMIN_ID) {
			notifyAdmin({
				text:
					status === 'success'
						? successText
						: `${errorText}\n\n📝 Reason:\n${error!.message}`,
			});
		}
	}
	ctx.scene.leave();
	removeTempMessages(ctx);
};
