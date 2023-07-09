import { isDevEnv } from './config';

export const puppeteerExecutablePath = isDevEnv ? '' : '/usr/bin/google-chrome';
