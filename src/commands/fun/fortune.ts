import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'request-promise';

const { version }: { version: string } = require('../../../package');

export default class FortuneCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'fortune',
			group: 'fun',
			memberName: 'fortune',
			description: 'Get a fortune.',
			details: stripIndents`Get a fortune. The following categories are avaliable:
				all, computers, cookie, definitions, miscellaneous, people, platitudes, politics, science, and wisdom.`,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'category',
					prompt: 'what category would you like to get a fortune on?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { category: string }): Promise<Message | Message[]> {
		const { category }: { category: string } = args;
		const regex: RegExp = /^(all|computers|cookie|definitions|miscellaneous|people|platitudes|politics|science|wisdom)$/i;
		const fortuneCategory: string = regex.test(category)
		? category.toLowerCase()
		: 'wisdom';

		const response: { fortune: string } = await request({
			uri: `http://www.yerkee.com/api/fortune/${category}`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		return msg.embed({
			color: 3447003,
			description: response.fortune
		});
	}
}
