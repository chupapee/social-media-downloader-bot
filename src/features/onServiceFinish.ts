import { IContextBot } from '../config';
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
	notifyAdmin({
		text:
			status === 'success'
				? successText
				: `${errorText}\n${error!.message}`,
	});
	if ('message' in ctx.update) {
		const user = ctx.update.message.from;
		saveServiceFinisher(user, socialMediaType);
	}
};
