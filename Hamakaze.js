global.Promise = require('bluebird');

const CaseModel = require('./mongoDB/models/Case');
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const config = require('./settings');

const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '',
	disableEveryone: true,
	messageCacheLifetime: 30,
	messageSweepInterval: 60,
	disabledEvents: [
		'GUILD_CREATE',
		'GUILD_DELETE',
		'GUILD_UPDATE',
		'GUILD_UNAVAILABLE',
		'GUILD_AVAILABLE',
		'GUILD_MEMBER_UPDATE',
		'GUILD_MEMBER_AVAILABLE',
		'GUILD_MEMBER_SPEAKING',
		'GUILD_ROLE_CREATE',
		'GUILD_ROLE_DELETE',
		'GUILD_ROLE_UPDATE',
		'CHANNEL_CREATE',
		'CHANNEL_DELETE',
		'CHANNEL_UPDATE',
		'CHANNEL_PINS_UPDATE',
		'MESSAGE_DELETE_BULK',
		'USER_UPDATE',
		'USER_NOTE_UPDATE',
		'PRESENCE_UPDATE',
		'TYPING_START',
		'TYPING_STOP',
		'VOICE_STATE_UPDATE',
		'FRIEND_ADD',
		'FRIEND_REMOVE',
		'RELATIONSHIP_ADD',
		'RELATIONSHIP_REMOVE'
	]
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(oneLine`
			Hamakaze setting sail...
			${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
	// Needs work (WIP)
	.on('guildBanAdd', (guild, user) => {
		let caseNumber;
		CaseModel.getCaseNumber(guild.id).then(caseNum => {
			caseNumber = parseInt(caseNum.caseNumber) + 1;
		}).catch(() => {
			caseNumber = 1;
		})
		.then(async () => {
			return new CaseModel({
				caseNumber: caseNumber,
				action: 'Ban',
				targetID: user.id,
				targetName: `${user.username}#${user.discriminator}`,
				guildID: guild.id,
				guildName: guild.name
			}).save().then(async () => {
				let modChannel = await guild.channels.find('name', 'mod-log');
				if (!modChannel) {
					modChannel = await guild.createChannel('mod-log', 'text');
				}

				if (!guild.member(this.client.user.id).hasPermission('MANAGE_CHANNELS') && !modChannel) return;

				if (!modChannel) {
					modChannel = await guild.createChannel('mod-log', 'text');
				}

				modChannel.sendMessage(stripIndents`**Ban** | Case ${caseNumber}
					**User:** ${user.username}#${user.discriminator} (${user.id})
					Responsible moderator, please do \`reason ${caseNumber} <reason>!\`
				`).then(messageID => { CaseModel.messageID(caseNumber, guild.id, messageID.id); });
				return;
			});
		});
	})
	// Needs work (WIP)
	.on('guildBanRemove', (guild, user) => {
		let caseNumber;
		CaseModel.getCaseNumber(guild.id).then(caseNum => {
			caseNumber = parseInt(caseNum.caseNumber) + 1;
		}).catch(() => {
			caseNumber = 1;
		})
		.then(async () => {
			return new CaseModel({
				caseNumber: caseNumber,
				action: 'Unban',
				targetID: user.id,
				targetName: `${user.username}#${user.discriminator}`,
				guildID: guild.id,
				guildName: guild.name
			}).save().then(async () => {
				let modChannel = await guild.channels.find('name', 'mod-log');
				if (!modChannel) {
					modChannel = await guild.createChannel('mod-log', 'text');
				}

				if (!guild.member(this.client.user.id).hasPermission('MANAGE_CHANNELS') && !modChannel) return;

				if (!modChannel) {
					modChannel = await guild.createChannel('mod-log', 'text');
				}

				modChannel.sendMessage(stripIndents`**Unban** | Case ${caseNumber}
					**User:** ${user.username}#${user.discriminator} (${user.id})
					Responsible moderator, please do \`reason ${caseNumber} <reason>!\`
				`).then(messageID => { CaseModel.messageID(caseNumber, guild.id, messageID.id); });
				return;
			});
		});
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		winston.info(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		winston.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

client.registry
	.registerGroups([
		['info', 'Info'],
		['anime', 'Anime'],
		['mod', 'Moderation'],
		['fun', 'Fun'],
		['weather', 'Weather'],
		['tags', 'Tags'],
		['rep', 'Reputation']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);
