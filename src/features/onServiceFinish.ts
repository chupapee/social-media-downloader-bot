import { BOT_ADMIN_ID, IContextBot } from '../config';
import { SocialMediaType } from '../entities/storage';
import { notifyAdmin } from '../shared/notifyAdmin';
import { saveServiceFinisher } from './storage';

interface OnServiceInitArgs {
	ctx: IContextBot;
	socialMediaType: SocialMediaType;
	status: 'success' | 'error';
	error?: Error;
}

export const onServiceFinish = ({
	ctx,
	socialMediaType,
	status,
	error,
}: OnServiceInitArgs) => {
	const successText = `${socialMediaType} service handled! ✅`;
	const errorText = `${socialMediaType} service failed! ❌`;
	if ('message' in ctx.update) {
		const user = ctx.update.message.from;
		if (user.id !== BOT_ADMIN_ID) {
			notifyAdmin({
				text:
					status === 'success'
						? successText
						: `${errorText}\n${error!.message}`,
			});
			saveServiceFinisher(user, socialMediaType);
		}
	}
};
