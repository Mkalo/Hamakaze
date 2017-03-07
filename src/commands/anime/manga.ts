import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
const nani: any = require('nani');

const { aniListID, aniListSecret } = require('../../settings');

type data = {
	error: {
		messages: {}[];
	}
	title_english: string;
	title_romaji: string;
	title_japanese: string;
	description: string;
	average_score: number;
	id: number;
	type: string;
	season: number;
	source: string;
	total_volumes: string;
	publishing_status: string;
	genres: string[];
	total_chapters: number;
	image_url_med: string;
	start_date: Date;
	end_date: Date;
};

export default class MangaCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'manga',
			aliases: ['mango'],
			group: 'anime',
			memberName: 'manga',
			description: 'Get info on an manga.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'manga',
					prompt: 'what manga would you like to look up?\n',
					type: 'string'
				}
			]
		});

		nani.init(aniListID, aniListSecret);
	}

	public async run(msg: CommandMessage, args: { manga: string }): Promise<Message | Message[]> {
		const { manga }: { manga: string } = args;

		let data: data = await nani.get(`manga/search/${manga}`);
		if (!Array.isArray(data)) {
			return msg.reply(data.error.messages[0]);
		}
		data = data.length === 1
			? data[0]
			// tslint:disable-next-line:ter-max-len
			: data.find((en: { title_english: string, title_romaji: string }) => en.title_english.toLowerCase() === manga.toLowerCase()
				|| en.title_romaji.toLowerCase() === manga.toLowerCase())
			|| data[0];
		const title: string = data.title_english !== '' && data.title_romaji !== data.title_english
			? `${data.title_english} / ${data.title_romaji} / ${data.title_japanese}`
			: `${data.title_romaji} / ${data.title_japanese}`;
		const synopsis: string = data.description
			? data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1000)
			: 'No description';
		const score: number = data.average_score / 10;

		return msg.embed({
			color: 3447003,
			author: {
				name: title,
				url: `https://www.anilist.co/manga/${data.id}`
			},
			fields: [
				{
					name: 'Type',
					value: data.type,
					inline: true
				},
				{
					name: 'Volumes',
					value: data.total_volumes,
					inline: true
				},
				{
					name: 'Status',
					value: data.publishing_status.replace(/(\b\w)/gi, (lc: string) => lc.toUpperCase()),
					inline: true
				},
				{
					name: 'Genre(s)',
					value: data.genres.join(', '),
					inline: true
				},
				{
					name: 'Chapters',
					value: data.total_chapters,
					inline: true
				},
				{
					name: 'Score',
					value: score.toFixed(2),
					inline: true
				},
				{
					name: 'Description:',
					value: `${synopsis}\n\u200B`,
					inline: false
				}
			],
			thumbnail: { url: data.image_url_med },
			footer: {
				text: `
					Started: ${moment.utc(data.start_date)
						.format('DD/MM/YYYY')} | Finished: ${data.end_date !== null
							? moment.utc(data.end_date)
								.format('DD/MM/YYYY')
							: '?'}
				`
			}
		});
	}
}
