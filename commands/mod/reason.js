const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const CaseModel = require('../../mongoDB/models/Case');

module.exports = class ReasonCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'reason',
			group: 'mod',
			memberName: 'reason',
			description: 'Reason for a Ban/Kick.',
			format: '<caseNumber> <reason>',
			guildOnly: true,
			argsType: 'multiple',
			argsCount: 2,

			args: [
				{
					key: 'caseNumber',
					prompt: 'What case number?\n',
					type: 'integer'
				},
				{
					key: 'reason',
					prompt: 'What is your reason for the ban/kick?\n',
					type: 'string',
					default: '',
					max: 120
				}
			]
		});
	}

	async run(msg, args) {
		const caseNumber = args.caseNumber;
		const reason = args.reason;

		return CaseModel.get(caseNumber, msg.guild.id).then(checkReason => {
			if (checkReason.reason === 'Placeholder') return this.updateReason(msg, caseNumber, reason);

			return this.update(msg, caseNumber, reason);
		}).catch(() => { msg.say(`I couldn't find a case with this number, ${msg.author}`); });
	}

	async updateReason(msg, caseNumber, reason) {
		if (!msg.member.hasPermission('BAN_MEMBERS')) return msg.say(`You can't possibly have banned this user, ${msg.author}!`);
		let channelID = await msg.guild.channels.find('name', 'mod-log');
		let userName = `${msg.author.username}#${msg.author.discriminator}`;
		CaseModel.updateReason(caseNumber, msg.guild.id, reason, msg.author.id, userName);

		return CaseModel.get(caseNumber, msg.guild.id).then(async message => {
			let editMsg = await channelID.fetchMessage(message.messageID);
			editMsg.edit(stripIndents`**${message.action}** | Case ${caseNumber}
				**User:** ${message.targetName} (${message.targetID})
				**Reason:** ${message.reason}
				**Responsible Moderator:** ${message.userName}
			`);
		}).catch(error => { winston.error(error); });
	}

	async update(msg, caseNumber, reason) {
		let channelID = await msg.guild.channels.find('name', 'mod-log');
		CaseModel.get(caseNumber, msg.guild.id).then(checkMod => {
			if (msg.author.id !== checkMod.userID) msg.say(`Only the responsible moderator can change their reason, ${msg.author}`);
			return;
		});
		CaseModel.update(caseNumber, msg.guild.id, reason);

		return CaseModel.get(caseNumber, msg.guild.id).then(async message => {
			let editMsg = await channelID.fetchMessage(message.messageID);
			editMsg.edit(stripIndents`**${message.action}** | Case ${caseNumber}
				**User:** ${message.targetName} (${message.targetID})
				**Reason:** ${message.reason}
				**Responsible Moderator:** ${message.userName}
			`);
		}).catch(error => { winston.error(error); });
	}
};
