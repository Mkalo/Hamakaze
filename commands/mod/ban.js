const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const CaseModel = require('../../mongoDB/models/Case');

module.exports = class BanCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'ban',
			group: 'mod',
			memberName: 'ban',
			description: 'Bans a user.',
			format: '<member>',
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 2,

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to ban?\n',
					type: 'member'
				},
				{
					key: 'reason',
					prompt: 'What is your reason for the ban?\n',
					type: 'string',
					default: '',
					max: 120
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.guild.member(this.client.user.id).hasPermission('BAN_MEMBERS')) {
			return msg.say(stripIndents`
				I don't have the permission to ban member on this server, ${msg.author}
				You need to give me permissions to ban member.
			`);
		}
		if (!msg.member.hasPermission('BAN_MEMBERS')) {
			return msg.say(stripIndents`
				You don't have the permission to ban member on this server, ${msg.author}
			`);
		}

		const member = args.member;
		const user = member.user;
		const reason = args.reason;
		let caseNumber;

		if (!member.bannable) return msg.say(`I can't do that, ${msg.author}`);

		return CaseModel.getCaseNumber(msg.guild.id).then(caseNum => {
			caseNumber = parseInt(caseNum.caseNumber) + 1;

			return this.ban(msg, member, user, caseNumber, reason);
		}).catch(() => {
			caseNumber = 1;

			return this.ban(msg, member, user, caseNumber, reason);
		});
	}

	async ban(msg, member, user, caseNumber, reason) {
		member.ban(1);

		return new CaseModel({
			caseNumber: caseNumber,
			action: 'Ban',
			targetID: user.id,
			targetName: `${user.username}#${user.discriminator}`,
			guildID: msg.guild.id,
			guildName: msg.guild.name,
			reason: reason,
			userID: msg.author.id,
			userName: `${msg.author.username}#${msg.author.discriminator}`
		}).save().then(async () => { return this.message(msg, user, caseNumber, reason); })
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

		return modChannel.sendMessage(stripIndents`**Ban** | Case ${caseNumber}
			**User:** ${user.username}#${user.discriminator} (${user.id})
			**Reason:** ${reason}
			**Responsible Moderator:** ${msg.author.username}#${msg.author.discriminator}
		`).then(messageID => { CaseModel.messageID(caseNumber, msg.guild.id, messageID.id); });
	}
};