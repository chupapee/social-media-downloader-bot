import { SocialMedia } from '@entities/storage';
import { BOT_ADMIN_ID, IContextBot } from '@shared/config';
import { notifyAdmin } from '@shared/notifyAdmin';

interface OnServiceInitArgs {
	ctx: IContextBot;
	socialMediaType: SocialMedia;
}

export const onServiceInit = ({ ctx, socialMediaType }: OnServiceInitArgs) => {
	if ('message' in ctx.update) {
		const user = ctx.update.message.from;
		if (user.id !== BOT_ADMIN_ID) {
			notifyAdmin({
				user,
				text: `${socialMediaType} service initialized! 🚀`,
			});
		}
	}
};
