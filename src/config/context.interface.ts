import { Scenes, Context } from 'telegraf';

interface IInstaLink {
    type?: string;
    href?: string;
}

export interface IYouLink {
    title?: string;
    descr?: string;
    quality?: string;
    href?: string;
}

export interface IUserSessionData {
    userId: number;
    twLinks?: Record<'quality' | 'href', string>[];
    twLinkOne?: string;

    instaLinks?: IInstaLink[];
    instaLinkOne?: IInstaLink | string;

    youLinks?: IYouLink[];
    youLinkOne?: IYouLink;
}

interface SceneSession extends Scenes.SceneSession {
    data: IUserSessionData[];
}

export interface IContextBot extends Context {
    scene: Scenes.SceneContextScene<IContextBot>;
    session: SceneSession;
}
