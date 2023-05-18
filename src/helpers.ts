import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { ConfigService } from './config.service';
import { IContextBot } from './context.interface';

const PAGE_URL = new ConfigService().get('PAGE_URL');

export async function preparePage(twitterLink: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'], timeout: 5000 });
    const page = await browser.newPage();
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#main_page_text');

    const input = await page.$('#main_page_text');
    await input?.type(twitterLink);
    await page.click('#submit');
    await page.waitForSelector('#result');
    const content = await page.content();
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

export function isUploadAction(val: string, ctx: IContextBot): RegExpExecArray | null {
    if (val.startsWith('download')) {
        const quality = val.split('@')[1];
        const data = ctx.session.data.find(({ userId }) => Number(userId) === Number(ctx.callbackQuery?.from.id));
        const link = data?.links.find((l) => l.quality === quality);
        ctx.state.link = link?.href;
        return {} as RegExpExecArray;
    }
    return null;
}
