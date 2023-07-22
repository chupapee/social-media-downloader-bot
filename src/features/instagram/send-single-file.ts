import { downloadLink, InstagramLink } from '@entities/instagram';
import { IContextBot } from '@shared/config';

interface SendSingleFileArgs {
	ctx: IContextBot;
	originalLink: string;
	link: InstagramLink;
}

export const sendSingleFile = async ({
	ctx,
	link,
	originalLink,
}: SendSingleFileArgs) => {
	const buffer = await downloadLink(link.href);

	const filename = link.source.length > 0 ? link.source : link.type;

	if (link.type === 'video') {
		await ctx.replyWithVideo(
			{ source: buffer!, filename: `${filename}.mp4` },
			{
				caption: `<a href='${originalLink}'>${link.source}</a>`,
				parse_mode: 'HTML',
			}
		);
		return;
	}
	await ctx.replyWithPhoto(
		{ source: buffer!, filename: `${filename}.jpg` },
		{
			caption: `<a href='${originalLink}'>${link.source}</a>`,
			parse_mode: 'HTML',
		}
	);
};
