global.Promise = require('bluebird');

const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const raven = require('raven');
const request = require('request-promise');
const sqlite = require('sqlite');
const winston = require('winston');

const Database = require('./postgreSQL/postgreSQL');
const config = require('./settings');

const database = new Database();
const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '',
	disableEveryone: true,
	messageCacheLifetime: 30,
	messageSweepInterval: 60
});
const sentry = new raven.Client(config.ravenKey);
sentry.patchGlobal();

database.start();

client.setProvider(sqlite.open(path.join(__dirname, 'settings.db'))
	.then(db => new commando.SQLiteProvider(db)))
	.catch(error => { winston.error(error); });

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(oneLine`
			Hamakaze setting sail...
			${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
		sendAbalStats();
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
	.on('guildCreate', () => { sendAbalStats(); })
	.on('guildDelete', () => { sendAbalStats(); })
	.on('commandRun', (cmd) => {
		winston.info(`${cmd.groupID}:${cmd.memberName}`);
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

function sendAbalStats() {
	const body = { server_count: client.guilds.size }; // eslint-disable-line camelcase

	request({
		method: 'POST',
		uri: `${config.abalURL}/bots/${client.user.id}/stats`,
		headers: { Authorization: config.abalKey },
		body: body,
		json: true
	}).then(() => {
		winston.info(`Sent guild count to bots.discord.pw with ${client.guilds.size} guilds.`);
	}).catch(err => {
		winston.error('Error while sending guild count to bots.discord.pw.', err);
	});
}

client.login(config.token);
