import { Message, User } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class BlacklistUserCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'blacklist-user',
			aliases: ['blacklist'],
			group: 'util',
			memberName: 'blacklist-user',
			description: 'Prohibit a user from using commando',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'user',
					prompt: 'what user should get blacklisted?\n',
					type: 'user'
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return this.client.isOwner(msg.author.id);
	}

	public async run(msg: CommandMessage, args: { user: User }): Promise<Message | Message[]> {
		const { user }: { user: User } = args;
		if (this.client.isOwner(user.id)) return msg.reply('the bot owner can not be blacklisted');

		const blacklist: string[] = this.client.provider.get('global', 'userBlacklist', []);
		if (blacklist.includes(user.id)) return msg.reply('that user is already blacklisted.');

		blacklist.push(user.id);
		this.client.provider.set('global', 'userBlacklist', blacklist);
		return msg.reply(`${user.username}#${user.discriminator} has been blacklisted from using ${this.client.user}.`);
	}
}
