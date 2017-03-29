import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const { defaultVolume }: { defaultVolume: number } = require('../../settings');

export default class DefaultVolumeCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'default-volume',
			group: 'music',
			memberName: 'default-volume',
			description: 'Shows or sets the default volume level.',
			format: '[level|"default"]',
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
			const defVolume: number = this.client.provider.get(msg.guild.id, 'defaultVolume', defaultVolume);
			return msg.reply(`the default volume level is **${defVolume}**.`);
		}

		if (args.toLowerCase() === 'default') {
			this.client.provider.remove(msg.guild.id, 'defaultVolume');
			return msg.reply(`set the default volume level to the bot's default (currently **${defaultVolume}**).`);
		}

		const defVolume: number = parseInt(args);
		if (isNaN(defVolume) || defVolume <= 0 || defVolume > 10) {
			return msg.reply(`invalid number provided. It must be in the range of 0-10.`);
		}

		this.client.provider.set(msg.guild.id, 'defaultVolume', defVolume);
		return msg.reply(`set the default volume level to **${defVolume}**.`);
	}
}
