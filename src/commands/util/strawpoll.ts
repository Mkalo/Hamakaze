import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { duration } from 'moment';
import * as request from 'request-promise';

const { version }: { version: string } = require('../../../package');

export default class StrawpollComamnd extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'strawpoll',
			group: 'util',
			memberName: 'strawpoll',
			description: 'Create a strawpoll.',
			details: stripIndents`Create a strawpoll.
				The first argument is always the title, if you provde it, otherwise your username will be used!
				If you need to use spaces in your title make sure you put them in SingleQuotes => \`'topic here'\``,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'title',
					prompt: 'what title would you like the strawpoll to have?\n',
					type: 'string',
					validate: (title: string) => {
						if (title.length > 200) {
							return `
								your title was ${title.length} characters long.
								Please limit your title to 200 characters.
							`;
						}
						return true;
					}
				},
				{
					key: 'options',
					label: 'option',
					prompt: 'what options would you like the strawpoll to have?\n',
					type: 'string',
					validate: (option: string) => {
						if (option.length > 160) {
							return `
								your option was ${option.length} characters long.
								Please limit your option to 160 characters.
							`;
						}
						return true;
					},
					infinite: true
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { title: string, options: string }): Promise<Message | Message[]> {
		const { title, options }: { title: string, options: string } = args;

		if (options.length < 2) return msg.reply('please provide 2 or more options.');
		if (options.length > 31) return msg.reply('please provide less than 31 options.');

		const response: { title: string, id: string } = await request({
			method: 'POST',
			uri: `https://strawpoll.me/api/v2/polls`,
			followAllRedirects: true,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			body: {
				title,
				options,
				captcha: true
			},
			json: true
		});

		return msg.say(stripIndents`🗳 ${response.title}
			<http://strawpoll.me/${response.id}>
		`);
	}
}
