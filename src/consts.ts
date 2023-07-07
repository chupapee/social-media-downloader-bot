import { ConfigService } from './config/config.service';

export const DEV_NODE_ENV = 'development';
export const puppeteerExecutablePath = process.env.NODE_ENV === DEV_NODE_ENV ? '' : '/usr/bin/google-chrome';

export const AUTHOR_ID = new ConfigService().get('AUTHOR_ID');
