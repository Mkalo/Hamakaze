const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const winston = require('winston');

const token = require('./settings').token;

const client = new commando.Client({
	owner: '81440962496172032',
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
		winston.log(oneLine`
			Hamakaze setting sail...
			${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.log(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		winston.log(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		winston.log(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		winston.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	});

client.registry
	.registerGroups([
		['fun', 'Fun'],
		['tags', 'Tags'],
		['rep', 'Reputation']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(token);
