import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
const nani = require('nani');

const { aniListID, aniListSecret } = require('../settings');

enum seasons {
	Winter,
	Spring,
	Summer,
	Fall
}

export default class AnimeCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'anime',
			aliases: ['animu'],
			group: 'anime',
			memberName: 'anime',
			description: 'Get info on an anime.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'anime',
					prompt: 'what anime would you like to look up?\n',
					type: 'string'
				}
			]
		});

		nani.init(aniListID, aniListSecret);
	}

	public async run(msg: CommandMessage, args: { anime: string }): Promise<Message | Message[]> {
		const { anime } = args;

		let data: any = await nani.get(`anime/search/${anime}`);
		if (!Array.isArray(data)) {
			return msg.reply(data.error.messages[0]);
		}
		data = data.length === 1
			? data[0]
			// tslint:disable-next-line:ter-max-len
			: data.find((en: { title_english: string, title_romaji: string }) => en.title_english.toLowerCase() === anime.toLowerCase()
				|| en.title_romaji.toLowerCase() === anime.toLowerCase())
			|| data[0];
		const title = data.title_english !== '' && data.title_romaji !== data.title_english
			? `${data.title_english} / ${data.title_romaji} / ${data.title_japanese}`
			: `${data.title_romaji} / ${data.title_japanese}`;
		const synopsis = data.description
			? data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1000)
			: 'No description';
		const score = data.average_score / 10;

		return msg.embed({
			color: 3447003,
			author: {
				name: title,
				url: `https://www.anilist.co/anime/${data.id}`
			},
			fields: [
				{
					name: 'Type',
					value: stripIndents`
						${data.type}
						${data.season !== null
							? this.parseSeason(data.season)
							: '?'}
						${data.source !== null
							? data.source
							: '?'}
					`,
					inline: true
				},
				{
					name: 'Episodes',
					value: data.total_episodes,
					inline: true
				},
				{
					name: 'Status',
					value: data.airing_status.replace(/(\b\w)/gi, (lc: string) => lc.toUpperCase()),
					inline: true
				},
				{
					name: 'Genre(s)',
					value: data.genres.join(', '),
					inline: true
				},
				{
					name: 'Episode length',
					value: `${data.duration !== null ? data.duration : '?'} mins/ep`,
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

	private parseSeason(season: number): string {
		return season < 350
			? `${seasons[season % 10]} 20${Math.floor(season / 10)}`
			: `${seasons[season % 10]} 19${Math.floor(season / 10)}`;
	}
}
