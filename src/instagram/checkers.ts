import { IContextBot } from '../config/context.interface';

export function isLinkAction(
	val: string,
	ctx: IContextBot
): RegExpExecArray | null {
	if (val.startsWith('download')) {
		const linkIndex = val.split('@')[1];
		if ('callback_query' in ctx.update) {
			const currentId = ctx.update.callback_query.from.id;
			const currentUser = ctx.session.data?.find(
				({ userId }) => userId === currentId
			);
			let link;
			if (linkIndex === 'All') {
				link = 'All';
			} else {
				link = currentUser?.instaLinks?.find(
					(_, i) => i === Number(linkIndex)
				);
			}
			if (link) {
				const allUsersExceptCurrent =
					ctx.session.data?.filter(
						({ userId }) => userId !== currentId
					) ?? [];
				ctx.session.data = [
					...allUsersExceptCurrent,
					{ ...currentUser!, instaLinkOne: link },
				];
				return {} as RegExpExecArray;
			}
			return null;
		}
	}
	return null;
}
