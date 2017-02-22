global.Promise = require('bluebird');

const commando = require('discord.js-commando');
const { oneLine } = require('common-tags');
const path = require('path');
const request = require('request-promise');
const winston = require('winston');

const Database = require('./postgreSQL/PostgreSQL');
const Redis = require('./redis/Redis');
const SequelizeProvider = require('./postgreSQL/SequelizeProvider');
const config = require('./settings');

const database = new Database();
const redis = new Redis();
const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '',
	disableEveryone: true,
	messageCacheLifetime: 30,
	messageSweepInterval: 60
});

database.start();
redis.start();

client.setProvider(new SequelizeProvider(database.db));

client.dispatcher.addInhibitor(msg => {
	const blacklist = client.provider.get('global', 'userBlacklist', []);

	if (!blacklist.includes(msg.author.id)) return false;

	return `User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) has been blacklisted.`;
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(oneLine`
			Hamakaze setting sail...
			${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})
		`);
	})
	.once('ready', () => {
		sendAbalStats();
	})
	.on('disconnect', () => winston.warn('Disconnected!'))
	.on('reconnect', () => winston.warn('Reconnecting...'))
	.on('guildCreate', () => sendAbalStats())
	.on('guildDelete', () => sendAbalStats())
	.on('commandRun', (cmd, promise, msg, args) => {
		winston.info(oneLine`${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args)[0] !== '' ? `>>> ${Object.values(args)}` : ''}
		`);
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}): ${reason}
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
		['fun', 'Fun'],
		['music', 'Music'],
		['weather', 'Weather']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

async function sendAbalStats() {
	const body = { server_count: client.guilds.size }; // eslint-disable-line camelcase

	try {
		await request({
			method: 'POST',
			uri: `${config.abalURL}/bots/${client.user.id}/stats`,
			headers: { Authorization: config.abalKey },
			body: body,
			json: true
		});

		winston.info(`Sent guild count to bots.discord.pw with ${client.guilds.size} guilds.`);
	} catch (error) {
		winston.error('Error while sending guild count to bots.discord.pw.', error);
	}
}

client.login(config.token);
