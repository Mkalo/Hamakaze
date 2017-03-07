import { oneLine } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const { maxLength }: { maxLength: number } = require('../../settings');

export default class MaxLengthCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'max-length',
			aliases: ['max-duration', 'max-song-length', 'max-song-duration'],
			group: 'music',
			memberName: 'max-length',
			description: 'Shows or sets the max song length.',
			format: '[minutes|"default"]',
			details: oneLine`
				This is the maximum length of a song that users may queue, in minutes.
				The default is ${maxLength}.
				Only administrators may change this setting.
			`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return msg.member.hasPermission('ADMINISTRATOR');
	}

	public async run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
		if (!args) {
			const mLength: number = this.client.provider.get(msg.guild.id, 'maxLength', maxLength);
			return msg.reply(`the maximum length of a song is **${mLength}** minutes.`);
		}

		if (args.toLowerCase() === 'default') {
			this.client.provider.remove(msg.guild.id, 'maxLength');
			return msg.reply(`set the maximum song length to the default (currently **${maxLength}** minutes).`);
		}

		const mLength: number = parseInt(args);
		if (isNaN(mLength) || mLength <= 0) {
			return msg.reply(`invalid number provided.`);
		}

		this.client.provider.set(msg.guild.id, 'maxLength', mLength);

		return msg.reply(`set the maximum song length to **${mLength}** minutes.`);
	}
}
