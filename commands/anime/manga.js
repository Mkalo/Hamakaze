const { Command } = require('discord.js-commando');
const moment = require('moment');
const nani = require('nani');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const config = require('../../settings');

const seasons = {
	1: 'Winter',
	2: 'Spring',
	3: 'Summer',
	4: 'Fall'
};

module.exports = class MangaCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'manga',
			aliases: ['mango', 'novel'],
			group: 'manga',
			memberName: 'manga',
			description: 'Get info on an manga.',
			format: '<manga/novel>',
			guildOnly: true,

			args: [
				{
					key: 'anime',
					prompt: 'What anime would you like to look up?\n',
					type: 'string'
				}
			]
		});

		nani.init(config.AniListID, config.AniListSecret);
	}

	async run(msg, args) {
		const manga = args.manga;
		// Because human interaction kek
		msg.channel.startTyping();
		try {
			let data = await nani.get(`manga/search/${manga}`);
			if (!Array.isArray(data)) {
				msg.channel.stopTyping();
				return msg.say(data.error.messages[0]);
			}
			data = data.length === 1 ? data[0] : data.find(en => en.title_english.toLowerCase() === manga.toLowerCase() || en.title_romaji.toLowerCase() === manga.toLowerCase()) || data[0];
			let title = data.title_english !== '' && data.title_romaji !== data.title_english ? `**${data.title_english}** / **${data.title_romaji}** / **${data.title_japanese}**` : `**${data.title_romaji}** / **${data.title_japanese}**`;
			let synopsis = data.description.replace(/\\n/g, '\n').replace(/<br>|\\r/g, '');
			let score = data.average_score / 10;

			// It would be horrible if she wouldn't stop typing
			msg.channel.stopTyping();

			return msg.say(stripIndents`
				${title}
				${data.type}  •  ${data.total_volumes} volumes, ${data.total_chapters} chapters  •  ${data.publishing_status.replace(/(\b\w)/gi, lc => lc.toUpperCase())} (${moment.utc(data.start_date).format('MMM DD, YYYY')} - ${data.end_date !== null ? moment.utc(data.end_date).format('MMM DD, YYYY') : '?'})
				Season: ${data.season !== null ? this.parseSeason(data.season) : '?'}  •  Scored ${score.toFixed(2)}  •  Genres: ${data.genres.join(', ')}
				<http://www.anilist.co/manga/${data.id}>

				**Description:**
				${synopsis}
			`);
		} catch (error) {
			msg.channel.stopTyping();
			winston.error(error);
		}
	}

	parseSeason(season) {
		return season < 350 ? `${seasons[season % 10]} 20${Math.floor(season / 10)}` : `${seasons[season % 10]} 19${Math.floor(season / 10)}`;
	}
};
