import { IContextBot } from '../config/context.interface';

export function isUploadAction(
	val: string,
	ctx: IContextBot
): RegExpExecArray | null {
	if (val.startsWith('download')) {
		const quality = val.split('@')[1];
		if ('callback_query' in ctx.update) {
			const currentId = ctx.update.callback_query.from.id;
			const currentUser = ctx.session.data?.find(
				({ userId }) => userId === currentId
			);
			const link = currentUser?.twLinks?.find(
				(l) => l.quality === quality
			);
			const allUsersExceptCurrent =
				ctx.session.data?.filter(
					({ userId }) => userId !== currentId
				) ?? [];
			ctx.session.data = [
				...allUsersExceptCurrent,
				{ ...currentUser!, twLinkOne: link?.href ?? '' },
			];
			return {} as RegExpExecArray;
		}
	}
	return null;
}
