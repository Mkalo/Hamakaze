import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'request-promise';

const { version }: { version: string } = require('../../../package');

export default class CatgirlCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'catgirl',
			aliases: ['catgirls', 'neko', 'nekos', 'nya', 'nyaa'],
			group: 'anime',
			memberName: 'catgirl',
			description: 'Posts a random catgirl.',
			details: 'Posts a random catgirl. Add `-nsfw` to the command to get nsfw pictures.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'nsfw',
					prompt: 'would you like to see NSFW pictures?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { nsfw: string }): Promise<Message | Message[]> {
		const { nsfw }: { nsfw: string } = args;

		const response: { url: string } = await request({
			uri: `http://catgirls.brussell98.tk/api${nsfw === '-nsfw' ? '/nsfw' : ''}/random`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		return msg.embed({
			color: 3447003,
			author: {
				name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
				icon_url: msg.author.displayAvatarURL
			},
			image: { url: response.url }
		});
	}
}
