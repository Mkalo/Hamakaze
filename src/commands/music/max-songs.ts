import { oneLine } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const { maxSongs }: { maxSongs: number } = require('../../settings');

export default class MaxSongsCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'max-songs',
			group: 'music',
			memberName: 'max-songs',
			description: 'Shows or sets the max songs per user.',
			format: '[amount|"default"]',
			details: oneLine`
				This is the maximum number of songs a user may have in the queue.
				The default is ${maxSongs}.
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
		return this.client.isOwner(msg.author) || msg.member.hasPermission('ADMINISTRATOR');
	}

	public async run(msg: CommandMessage, args: string): Promise<Message | Message[]> {
		if (!args) {
			const mSongs: number = this.client.provider.get(msg.guild.id, 'maxSongs', maxSongs);
			return msg.reply(`the maximum songs a user may have in the queue at one time is **${mSongs}**.`);
		}

		if (args.toLowerCase() === 'default') {
			this.client.provider.remove(msg.guild.id, 'maxSongs');
			return msg.reply(`set the maximum songs to the default (currently **${maxSongs}**).`);
		}

		const mSongs: number = parseInt(args);
		if (isNaN(mSongs) || mSongs <= 0) {
			return msg.reply(`invalid number provided.`);
		}

		this.client.provider.set(msg.guild.id, 'maxSongs', mSongs);
		return msg.reply(`set the maximum songs to **${mSongs}**.`);
	}
}
