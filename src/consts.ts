export const DEV_NODE_ENV = 'development';
export const puppeteerExecutablePath = process.env.NODE_ENV === DEV_NODE_ENV ? '' : '/usr/bin/google-chrome';
