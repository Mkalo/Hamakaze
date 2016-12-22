const { Command } = require('discord.js-commando');
const request = require('request-promise');
const winston = require('winston');

const version = require('../../package').version;

module.exports = class CatgirlCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'catgirl',
			aliases: ['nyaa', 'neko', 'catgirls'],
			group: 'fun',
			memberName: 'catgirl',
			description: 'Posts a random catgirl. Add `--nsfw` to the command to get nsfw pictures.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'nsfw',
					prompt: 'Would you like to see NSFW pictures?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const nsfw = args.nsfw;

		return request({
			uri: `http://catgirls.brussell98.tk/api${nsfw === '--nsfw' ? '/nsfw' : ''}/random`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		})
		.then(response => {
			let embed = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: `${msg.author.avatarURL}` // eslint-disable-line camelcase
				},
				image: { url: `${response.url}` },
				timestamp: new Date(),
				footer: {
					icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
					text: 'Catgirls'
				}
			};
			return msg.embed(embed);
		})
		.catch(error => { winston.error(error); });
	}
};
