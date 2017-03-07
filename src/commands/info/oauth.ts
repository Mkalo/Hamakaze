import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const { oauthLink }: { oauthLink: string } = require('../../../package');

export default class AboutCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'oauth',
			aliases: ['invite', 'inv'],
			group: 'info',
			memberName: 'oauth',
			description: 'The link to add Hamakaze to a server.',
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		if (!oauthLink) return msg.say(`I don't have an invite link for you at the moment. Sorry, ${msg.author}.`);

		return msg.say(stripIndents`Use this to add me to a server, ${msg.author}:
			${oauthLink}
			Make sure you are logged in!
		`);
	}
}
