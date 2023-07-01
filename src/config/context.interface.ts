import { Context, Scenes } from 'telegraf';

interface IInstaLink {
	type?: string;
	href?: string;
	source?: string;
}

export interface IYouLink {
	title?: string;
	descr?: string;
	quality: string;
	href: string;
}

export interface IUserSessionData {
	userId: number;
	twLinks?: Record<'quality' | 'href', string>[];
	twLinkOne?: string;
	twOriginal?: string;

	instaLinks?: IInstaLink[];
	instaLinkOne?: IInstaLink | string;
	instaOriginal?: string;

	youOriginal?: string;
	youLinks?: IYouLink[];
	youLinkOne?: IYouLink;
}

interface SceneSession extends Scenes.SceneSession {
	data: IUserSessionData[];
}

export interface IContextBot extends Context {
	scene: Scenes.SceneContextScene<IContextBot>;
	session: SceneSession;
	i18n: {
		locale: (lang?: string) => string; // get|set current locale
		t: (recourceKey: string, ctx?: unknown) => string; // Get resource value (context will be used by template engine)
	};
}
