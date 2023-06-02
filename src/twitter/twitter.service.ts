import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { IContextBot } from '../context.interface';

import { ConfigService } from '../config.service';
import { timeout } from '../utils/utils';

const PAGE_URL = new ConfigService().get('TWITTER_PAGE_URL');

export async function preparePage(twitterLink: string): Promise<string> {
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
}

export async function getLinks(twitterLink: string, ctx: IContextBot) {
    let attemptsCount = 1;
    const maxAttempts = 5;
    const {
        message_id,
        chat: { id },
    } = await ctx.reply(`🛠 ${attemptsCount} попытка`);

    let content: string | null = null;
    while (!content && attemptsCount <= maxAttempts) {
        if (attemptsCount > 1) {
            await ctx.telegram.editMessageText(id, message_id, '', `🛠 ${attemptsCount} попытка`);
        }

        try {
            content = await Promise.race([timeout(15_000), preparePage(twitterLink)]);
        } catch (error) {
            console.log('prepare failed');
        }
        attemptsCount++;
    }

    await ctx.telegram.deleteMessage(id, message_id);
    return content;
}

export const parseForQuality = (page: string) => {
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
