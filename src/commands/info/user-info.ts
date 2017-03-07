import { stripIndents } from 'common-tags';
import { GuildMember, Message, Role, User } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';

export default class UserInfoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'user-info',
			aliases: ['user'],
			group: 'info',
			memberName: 'user',
			description: 'Get info on a user.',
			details: 'Get detailed information on the specified user.',
			guildOnly: true,

			args: [
				{
					key: 'member',
					prompt: 'what user would you like to have information on?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { member: GuildMember }): Promise<Message | Message[]> {
		const member: GuildMember = args.member || msg.member;
		const user: User = member.user;

		return msg.edit({
			embed: {
				color: 3447003,
				fields: [
					{
						name: '❯ Member Details',
						value: stripIndents`
						${member.nickname !== null ? ` • Nickname: ${member.nickname}` : '• No nickname'}
						• Roles: ${member.roles.map((roles: Role) => `\`${roles.name}\``).join(' ')}
						• Joined at: ${moment.utc(member.joinedAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}
					`
					},
					{
						name: '❯ User Details',
						value: stripIndents`
						• Created at: ${moment.utc(user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}${user.bot
								? '\n• Is a bot account'
								: ''}
						• Status: ${user.presence.status}
						• Game: ${user.presence.game ? user.presence.game.name : 'None'}
					`
					}
				],
				thumbnail: { url: user.avatarURL }
			}
		});
	}
}
