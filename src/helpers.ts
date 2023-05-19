import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { ConfigService } from './config.service';
import { IContextBot } from './context.interface';

const PAGE_URL = new ConfigService().get('PAGE_URL');
const timeout = (sec: number): Promise<null> => new Promise((ok) => setTimeout(ok, sec));

export async function preparePage(twitterLink: string): Promise<string> {
    let content = '';
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' }).catch(e => void e);

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
    const { message_id, chat: { id } } = await ctx.reply(`🛠 ${attemptsCount} попытка`);

    let content: string | null = null;
    while(!content && attemptsCount <= maxAttempts) {
        if(attemptsCount > 1) {
            await ctx.telegram.editMessageText(id, message_id, '', `🛠 ${attemptsCount} попытка`);
        }

        try {
            content = await Promise.race([
                timeout(15_000),
                preparePage(twitterLink)
            ]);
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

export function isUploadAction(val: string, ctx: IContextBot): RegExpExecArray | null {
    if (val.startsWith('download')) {
        const quality = val.split('@')[1];
        if('callback_query' in ctx.update) {
            const currentId = ctx.update.callback_query.from.id;
            const currentUser = ctx.session.data.find(({ userId }) => userId === currentId);
            const link = currentUser?.links.find((l) => l.quality === quality);
            const allUsersExceptCurrent = ctx.session.data.filter(({ userId }) => userId !== currentId);
            ctx.session.data = [...allUsersExceptCurrent, {...currentUser!, link: link?.href ?? ''}];
            return {} as RegExpExecArray;
        }
    }
    return null;
}
