const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Case = require('../../postgreSQL/models/Case');

module.exports = class ReasonCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'reason',
			group: 'mod',
			memberName: 'reason',
			description: 'Reason for a Ban/Kick.',
			format: '<caseNumber> <reason>',
			guildOnly: true,

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
					max: 250
				}
			]
		});
	}

	async run(msg, args) {
		const caseNumber = args.caseNumber;
		const reason = args.reason;

		let checkReason = await Case.findOne({ where: caseNumber, guildID: msg.guild.id });
		if (!checkReason) return msg.say(`I couldn't find a case with this number, ${msg.author}`);
		if (checkReason.reason === 'Placeholder') return this.updateReason(msg, caseNumber, reason);

		return this.update(msg, caseNumber, reason);
	}

	async updateReason(msg, caseNumber, reason) {
		if (!msg.member.hasPermission('BAN_MEMBERS')) return msg.say(`You can't possibly have banned this user, ${msg.author}!`);
		let channelID = await msg.guild.channels.find('name', 'mod-log');
		let userName = `${msg.author.username}#${msg.author.discriminator}`;
		Case.update({ reason, moderatorID: msg.author.id, moderatorName: userName }, { where: { caseNumber, guildID: msg.guild.id } });

		let caseReason = await Case.findOne({ where: { caseNumber, guildID: msg.guild.id } });
		let editMsg = await channelID.fetchMessage(caseReason.messageID);
		editMsg.edit(stripIndents`**${caseReason.action}** | Case ${caseNumber}
			**User:** ${caseReason.targetName} (${caseReason.targetID})
			**Reason:** ${caseReason.reason}
			**Responsible Moderator:** ${caseReason.userName}
		`);
		return msg.say(`👌`).then(okMessage => okMessage.delete(3000));
	}

	async update(msg, caseNumber, reason) {
		let channelID = await msg.guild.channels.find('name', 'mod-log');
		let checkMod = await Case.findOne({ where: { caseNumber, guildID: msg.guild.id } });
		if (msg.author.id !== checkMod.userID) return msg.say(`Only the responsible moderator can change their reason, ${msg.author}`);
		Case.update({ reason }, { where: { caseNumber, guildID: msg.guild.id } });

		let caseReason = await Case.findOne({ where: { caseNumber, guildID: msg.guild.id } });
		let editMsg = await channelID.fetchMessage(caseReason.caseReasonID);
		editMsg.edit(stripIndents`**${caseReason.action}** | Case ${caseNumber}
			**User:** ${caseReason.targetName} (${caseReason.targetID})
			**Reason:** ${caseReason.reason}
			**Responsible Moderator:** ${caseReason.userName}
		`);

		return msg.say(`👌`).then(okMessage => okMessage.delete(3000));
	}
};
