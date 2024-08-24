import puppeteer, { Browser } from 'puppeteer';

import { puppeteerExecutablePath } from '../consts';

export class PuppeteerBrowser {
	private static browser: Browser;

	public static async getInstance() {
		if (!PuppeteerBrowser.browser) {
			// FIXME: RACE CONDITION ISSUE
			PuppeteerBrowser.browser = await puppeteer.launch({
				executablePath: puppeteerExecutablePath,
				headless: false,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});
		}
		return PuppeteerBrowser.browser;
	}
}

export async function launchBrowser() {
	await PuppeteerBrowser.getInstance(); // init

	console.log('puppeteer browser launched');
}
