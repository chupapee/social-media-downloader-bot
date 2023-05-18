import { Scenes, Context } from 'telegraf';

export interface IUserSessionData {
    userId: number;
    links: { quality: string, href: string }[]
}

interface SceneSession extends Scenes.SceneSession {
    data: IUserSessionData[];
}

export interface IContextBot extends Context {
    scene: Scenes.SceneContextScene<IContextBot>;
    session: SceneSession;
}