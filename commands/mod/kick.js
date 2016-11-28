const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const Case = require('../../postgreSQL/models/Case');

module.exports = class KickCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'kick',
			group: 'mod',
			memberName: 'kick',
			description: 'Kicks a user.',
			format: '<member> [reason]',
			guildOnly: true,

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to kick?\n',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'What is your reason for the kick?\n',
					type: 'string',
					default: '',
					max: 250
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.guild.member(this.client.user.id).hasPermission('KICK_MEMBERS')) {
			return msg.say(stripIndents`
				I don't have the permission to kick member on this server, ${msg.author}
				You need to give me permissions to kick member.
			`);
		}
		if (!msg.member.hasPermission('KICK_MEMBERS')) {
			return msg.say(`You don't have the permission to kick member on this server, ${msg.author}`);
		}

		const member = args.member;
		const user = member.user;
		const reason = args.reason;

		if (!member.kickable) return msg.say(`I can't do that, ${msg.author}`);

		let caseNumber = await Case.findOne({ where: { guildID: msg.guild.id }, order: '"caseNumber" DESC' });
		if (!caseNumber) {
			caseNumber = 1;

			return this.kick(msg, member, user, caseNumber, reason);
		}

		caseNumber = parseInt(caseNumber) + 1;

		return this.kick(msg, member, user, caseNumber, reason);
	}

	async kick(msg, member, user, caseNumber, reason) {
		member.kick();

		return Case.sync()
			.then(() => {
				Case.create({
					caseNumber: caseNumber,
					action: 'Kick',
					targetID: user.id,
					targetName: `${user.username}#${user.discriminator}`,
					guildID: msg.guild.id,
					guildName: msg.guild.name,
					reason: reason,
					moderatorID: msg.author.id,
					moderatorName: `${msg.author.username}#${msg.author.discriminator}`
				});
				msg.say(`🆗`).then(message => message.delete(3000));

				return this.message(msg, user, caseNumber, reason);
			})
			.catch(error => { winston.error(error); });
	}

	async message(msg, user, caseNumber, reason) {
		let modChannel = await msg.guild.channels.find('name', 'mod-log');
		if (!msg.guild.member(this.client.user.id).hasPermission('MANAGE_CHANNELS') && !modChannel) {
			return msg.say(stripIndents`
				I don't have the permission to manage channels on this server, ${msg.author}
				If you want logging of bans/kicks you need to either give me permissions to manage channels or create a channel with the name \`mod-log\`!
			`);
		}
		if (!modChannel) {
			modChannel = await msg.guild.createChannel('mod-log', 'text');
		}

		return modChannel.sendMessage(stripIndents`**Kick** | Case ${caseNumber}
			**User:** ${user.username}#${user.discriminator} (${user.id})
			**Reason:** ${reason ? reason : `Responsible moderator, please do \`reason ${caseNumber} <reason>!\``}
			**Responsible Moderator:** ${msg.author.username}#${msg.author.discriminator}
		`).then(messageID => { Case.update({ messageID: messageID.id }, { where: { caseNumber, guildID: msg.guild.id } }); });
	}
};
