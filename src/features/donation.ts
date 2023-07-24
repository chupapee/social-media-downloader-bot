import { i18n, IContextBot } from '@shared/config';

const supportBtnTexts = [
	i18n.t('ru', 'supportBtnText'),
	i18n.t('en', 'supportBtnText'),
];

export const isDonationTrigger = (text: string) =>
	supportBtnTexts.includes(text);

const DONATION_URL = 'https://www.donationalerts.com/r/chupapee';

export const makeDonation = async (ctx: IContextBot) => {
	await ctx.reply(ctx.i18n.t('donationText'), {
		parse_mode: 'Markdown',
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: '🔗 donationalerts.com',
						url: DONATION_URL,
					},
				],
			],
		},
	});
};
