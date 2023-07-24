import { User } from 'typegram';

export interface DatabaseEntities {
	'social-media-bot'?: User[];
	socialBotUpFlag?: boolean;
	footballStats?: User[];
}

export type SocialMedia = 'twitter' | 'youtube' | 'instagram' | 'tiktok';
