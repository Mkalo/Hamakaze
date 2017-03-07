import { stripIndents } from 'common-tags';
import { Guild, Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';
import 'moment-duration-format';

const { version }: { version: string } = require('../../../package');

export default class StatsCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'stats',
			aliases: ['statistics'],
			group: 'util',
			memberName: 'stats',
			description: 'Displays statistics about the bot.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed({
			color: 3447003,
			description: '**Hamakaze Statistics**',
			fields: [
				{
					name: '❯ Uptime',
					value: moment.duration(this.client.uptime)
						.format('d[ days], h[ hours], m[ minutes, and ]s[ seconds]'),
					inline: true
				},
				{
					name: '❯ Memory usage',
					value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
					inline: true
				},
				{
					name: '❯ General Stats',
					value: stripIndents`
					• Guilds: ${this.client.guilds.size}
					• Channels: ${this.client.channels.size}
					• Users: ${this.client.guilds.map((guild: Guild) => guild.memberCount).reduce((a: number, b: number): number => a + b)}
					`,
					inline: true
				},
				{
					name: '❯ Version',
					value: `v${version}`,
					inline: true
				}
			],
			thumbnail: { url: this.client.user.avatarURL }
		});
	}
}
