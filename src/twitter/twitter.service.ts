import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

import { ConfigService } from '../config/config.service';
import { timeout } from '../utils/utils';

const PAGE_URL = new ConfigService().get('TWITTER_PAGE_URL');

export const getPage = async (twitterLink: string): Promise<string> => {
    let content = '';
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' }).catch((e) => void e);

        await page.waitForSelector('#main_page_text');
        const input = await page.$('#main_page_text');
        await timeout(3000);
        await input?.type(twitterLink);
        await timeout(500);
        await page.click('#submit');

        await page.waitForSelector('.download_link', { timeout: 5000 });

        content = await page.content();
    } catch (error) {
        console.log(error);
    }
    await page.close();
    await browser.close();
    return content;
};

export const parseLink = (page: string) => {
    const $ = cheerio.load(page);
    const qualities: Record<'quality' | 'href', string>[] = [];
    $('.download_link').each((_, el) => {
        if($(el).attr('href')) {
            const quality = $(el).text().replace('Download', '').trim();
            const href = $(el).attr('href');
            qualities.push({ quality, href: href! });
        }
    });

    return qualities.reverse();
};
