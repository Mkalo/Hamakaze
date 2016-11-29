const { Command } = require('discord.js-commando');
const moment = require('moment');
const nani = require('nani');
const winston = require('winston');

const config = require('../../settings');

module.exports = class MangaCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'manga',
			aliases: ['mango', 'novel'],
			group: 'anime',
			memberName: 'manga',
			description: 'Get info on an manga.',
			format: '<manga/novel>',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'manga',
					prompt: 'What manga would you like to look up?\n',
					type: 'string'
				}
			]
		});

		nani.init(config.AniListID, config.AniListSecret);
	}

	async run(msg, args) { // eslint-disable-line consistent-return
		const manga = args.manga;

		try {
			let data = await nani.get(`manga/search/${manga}`);
			if (!Array.isArray(data)) {
				msg.channel.stopTyping();
				return msg.say(data.error.messages[0]);
			}
			data = data.length === 1 ? data[0] : data.find(en => en.title_english.toLowerCase() === manga.toLowerCase() || en.title_romaji.toLowerCase() === manga.toLowerCase()) || data[0];
			let title = data.title_english !== '' && data.title_romaji !== data.title_english ? `${data.title_english} / ${data.title_romaji} / ${data.title_japanese}` : `${data.title_romaji} / ${data.title_japanese}`;
			let synopsis = data.description ? data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '').substring(0, 1000) : 'No description.';
			let score = data.average_score / 10;

			let embed = {
				color: 3447003,
				author: {
					name: title,
					url: `http://www.anilist.co/manga/${data.id}`
				},
				fields: [
					{
						name: 'Type',
						value: `${data.type}`,
						inline: true
					},
					{
						name: 'Volumes',
						value: `${data.total_volumes}`,
						inline: true
					},
					{
						name: 'Status',
						value: `${data.publishing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase())}`,
						inline: true
					},
					{
						name: 'Genre(s)',
						value: `${data.genres.join(', ')}`,
						inline: true
					},
					{
						name: 'Chapters',
						value: `${data.total_chapters}`,
						inline: true
					},
					{
						name: 'Score',
						value: `${score.toFixed(2)}`,
						inline: true
					},
					{
						name: 'Description:',
						value: `${synopsis}\n\u200B`,
						inline: false
					}
				],
				thumbnail: { url: `${data.image_url_med}` },
				footer: {
					icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
					text: `Started: ${moment.utc(data.start_date).format('DD/MM/YYYY')} | Finished: ${data.end_date !== null ? moment.utc(data.end_date).format('DD/MM/YYYY') : '?'}`
				}
			};

			return msg.channel.sendMessage('', { embed });
		} catch (error) { winston.error(error); }
	}
};
