import { Context, Scenes } from 'telegraf';

export interface UserSessionData {
	userId: number;
}

interface SceneSession extends Scenes.SceneSession {
	data: UserSessionData[];
}

export interface IContextBot extends Context {
	scene: Scenes.SceneContextScene<IContextBot>;
	session: SceneSession;
	i18n: {
		locale: (lang?: string) => string; // get|set current locale
		t: (recourceKey: string, ctx?: unknown) => string; // Get resource value (context will be used by template engine)
	};
}
