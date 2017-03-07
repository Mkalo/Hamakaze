import { Collection, GuildMember, Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class CleanCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'clean',
			aliases: ['purge', 'prune', 'clear'],
			group: 'util',
			memberName: 'clean',
			description: 'Deletes message.',
			details: `Deletes messages. Here is a list of filters:
				__invites:__ Messages containing an invite
				__user @user:__ Messages sent by @user
				__bots:__ Messages sent by bots
				__uploads:__ Messages containing an attachment
				__links:__ Messages containing a link`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'limit',
					prompt: 'how many messages would you like to delete?\n',
					type: 'integer',
					max: 100
				},
				{
					key: 'filter',
					prompt: 'what filter would you like to apply?\n',
					type: 'string',
					default: ''
				},
				{
					key: 'member',
					prompt: 'whose messages would you like to delete?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return msg.member.hasPermission('MANAGE_MESSAGES');
	}

	public async run(msg: CommandMessage, args: { limit: number, filter: string, member: GuildMember }): Promise<Message | Message[]> { // tslint:disable-line:ter-max-len
		const limit: number = args.limit;
		const filter: string = args.filter.toLowerCase();

		let messageFilter: (message: Message) => boolean;

		if (filter) {
			if (filter === 'invite') {
				messageFilter = (message: Message) => message.content.search(/(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i) !== -1; // tslint:disable-line:ter-max-len
			} else if (filter === 'user') {
				if (args.member) {
					const member: GuildMember = args.member;
					messageFilter = (message: Message) => message.author.id === member.id;
				} else {
					return msg.say(`${msg.author}, you have to mention someone.`);
				}
			} else if (filter === 'bots') {
				messageFilter = (message: Message) => message.author.bot;
			} else if (filter === 'you') {
				messageFilter = (message: Message) => message.author.id === this.client.user.id;
			} else if (filter === 'upload') {
				messageFilter = (message: Message) => message.attachments.size !== 0;
			} else if (filter === 'links') {
				messageFilter = (message: Message) => message.content.search(/https?:\/\/[^ \/\.]+\.[^ \/\.]+/) !== -1;
			} else {
				return msg.say(`${msg.author}, that is not a valid filter. \`help clean\` for all available filters.`);
			}

			const messages: Collection<string, Message> = await msg.channel.fetchMessages({ limit });
			const messagesToDelete: Collection<string, Message> = messages.filter(messageFilter);

			msg.channel.bulkDelete(messagesToDelete.array().reverse());

			return null;
		}

		msg.channel.bulkDelete(limit);

		return null;
	}
}
