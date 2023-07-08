import { config } from 'dotenv';

const { parsed } = config();

export const getEnvVar = (key: string) => {
	if (process.env[key] === undefined || parsed?.[key] === undefined) {
		throw new Error(`Env variable ${key} is required`);
	}
	return process.env[key] || parsed[key] || '';
};

/** Runtime mode */
export const NODE_ENV = getEnvVar('NODE_ENV');
/** Dev mode */
export const isDevEnv = NODE_ENV === 'development';
/** Prod mode */
export const isProdEnv = NODE_ENV === 'production';

/** bot's token */
export const BOT_TOKEN = isDevEnv
	? getEnvVar('DEV_BOT_TOKEN')
	: getEnvVar('PROD_BOT_TOKEN');

/** bot's author telegram id */
export const BOT_AUTHOR_ID = Number(getEnvVar('BOT_AUTHOR_ID'));

/** Pages url to scrape */
export const TWITTER_PAGE_URL = getEnvVar('TWITTER_PAGE_URL');
export const INSTA_PAGE_URL = getEnvVar('INSTA_PAGE_URL');
export const TIKTOK_PAGE_URL = getEnvVar('TIKTOK_PAGE_URL');
export const YOUTUBE_PAGE_URL = getEnvVar('YOUTUBE_PAGE_URL');
