import { isDevEnv } from './config';

export const puppeteerExecutablePath = isDevEnv ? '' : '/usr/bin/google-chrome';

export const STATS_ACTION_ID = 'stats';
