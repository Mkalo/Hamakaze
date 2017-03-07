import { stripIndents } from 'common-tags';
import { Channel, Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as moment from 'moment';

enum humanLevels {
	'None',
	'Low',
	'Medium',
	'(╯°□°）╯︵ ┻━┻'
};

export default class ServerInfoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'server-info',
			aliases: ['server'],
			group: 'info',
			memberName: 'server',
			description: 'Get info on the server.',
			details: 'Get detailed information on the server.',
			guildOnly: true
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.edit({
			embed: {
				color: 3447003,
				description: `Info on **${msg.guild.name}** (ID: ${msg.guild.id})`,
				fields: [
					{
						name: '❯ Channels',
						value: stripIndents`
							• ${msg.guild.channels
								.filter((ch: Channel) => ch.type === 'text').size} Text, ${msg.guild.channels
									.filter((ch: Channel) => ch.type === 'voice').size} Voice
							• Default: ${msg.guild.defaultChannel}
							• AFK: ${msg.guild.afkChannelID
								? `<#${msg.guild.afkChannelID}> after ${msg.guild.afkTimeout / 60}min`
								: 'None.'}
						`,
						inline: true
					},
					{
						name: '❯ Member',
						value: stripIndents`
							• ${msg.guild.memberCount} members
							• Owner: ${msg.guild.owner.user.username}#${msg.guild.owner.user.discriminator}
							(ID: ${msg.guild.ownerID})
						`,
						inline: true
					},
					{
						name: '❯ Other',
						value: stripIndents`
							• Roles: ${msg.guild.roles.size}
							• Region: ${msg.guild.region}
							• Created at: ${moment.utc(msg.guild.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}
							• Verification Level: ${humanLevels[msg.guild.verificationLevel]}
						`
					}
				],
				thumbnail: { url: msg.guild.iconURL }
			}
		});
	}
}
