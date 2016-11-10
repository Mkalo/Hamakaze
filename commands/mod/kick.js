const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const CaseModel = require('../../mongoDB/models/Case');

module.exports = class KickCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'kick',
			group: 'mod',
			memberName: 'kick',
			description: 'Kicks a user.',
			format: '<member>',
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 2,

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
					max: 200
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
			return msg.say(stripIndents`
				You don't have the permission to kick member on this server, ${msg.author}
			`);
		}

		const member = args.member;
		const user = member.user;
		const reason = args.reason;
		let caseNumber;

		if (!member.kickable) return msg.say(`I can't do that, ${msg.author}`);

		return CaseModel.getCaseNumber(msg.guild.id).then(caseNum => {
			caseNumber = parseInt(caseNum.caseNumber) + 1;

			return this.kick(msg, member, user, caseNumber, reason);
		}).catch(() => {
			caseNumber = 1;

			return this.kick(msg, member, user, caseNumber, reason);
		});
	}

	async kick(msg, member, user, caseNumber, reason) {
		member.kick();

		return new CaseModel({
			caseNumber: caseNumber,
			action: 'Kick',
			targetID: user.id,
			targetName: `${user.username}#${user.discriminator}`,
			guildID: msg.guild.id,
			guildName: msg.guild.name,
			reason: reason,
			userID: msg.author.id,
			userName: `${msg.author.username}#${msg.author.discriminator}`
		}).save().then(async () => {
			msg.say(`🆗`);
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
		`).then(messageID => { CaseModel.messageID(caseNumber, msg.guild.id, messageID.id); });
	}
};
