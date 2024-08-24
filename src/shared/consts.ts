import { isDevEnv } from './config/config.service';

export const puppeteerExecutablePath = isDevEnv
	? '/usr/bin/google-chrome-stable'
	: '/usr/bin/google-chrome';

export const STATS_ACTION_ID = 'stats';
