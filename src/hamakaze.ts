global.Promise = require('bluebird');

import { oneLine } from 'common-tags';
import { Collection, Guild, Message, TextChannel } from 'discord.js';
// tslint:disable-next-line:ter-max-len
import { Command, CommandGroup, CommandMessage, CommandoClient, CommandRegistry, FriendlyError, GuildExtension, SQLiteProvider } from 'discord.js-commando';
import * as path from 'path';
import * as request from 'request-promise';
import * as winston from 'winston';

import Database from './database/postgresql';
import Redis from './database/redis';
import * as SequelizeProvider from './providers/sequelize';

const config: any = require('./settings.json');

const database: Database = new Database();
const redis: Redis = new Redis();
const client: CommandoClient = new CommandoClient({
	owner: config.owner,
	commandPrefix: '',
	disableEveryone: true,
	messageCacheLifetime: 30,
	messageSweepInterval: 60
});

database.start();
redis.start();

client.setProvider(new SequelizeProvider(database.db)).catch(winston.error);

client.dispatcher.addInhibitor((msg: Message): any => {
	const blacklist: string[] = client.provider.get('global', 'userBlacklist', []);

	if (!blacklist.includes(msg.author.id)) return false;

	return `User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) has been blacklisted.`;
});

client.on('error', (err: Error) => winston.error(`${err}`))
	.on('warn', (info: string) => winston.warn(info))
	.on('ready', () => {
		winston.info(oneLine`
			Hamakaze setting sail...
			${client.user.username}#${client.user.discriminator} (ID: ${client.user.id})
		`);
	})
	/*.once('ready', () => sendAbalStats())*/
	.on('disconnect', () => winston.warn('Disconnected!'))
	.on('reconnecting', () => winston.warn('Reconnecting...'))
	/*.on('guildCreate', () => sendAbalStats())*/
	/*.on('guildDelete', () => sendAbalStats())*/
	// tslint:disable-next-line:ter-max-len
	.on('commandRun', (cmd: Command, promise: Promise<any>, msg: CommandMessage, args: string | {} | string[]) => {
		winston.info(oneLine`${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args)[0] !== '' ? `>>> ${Object.values(args)}` : ''}
		`);
	})
	.on('commandError', (cmd: Command, err: {}) => {
		if (err instanceof FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg: CommandMessage, reason: string) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild: Guild, prefix: string) => {
		winston.info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}
		`);
	})
	.on('commandStatusChange', (guild: Guild, cmd: Command, enabled: boolean) => {
		winston.info(oneLine`
			Command ${cmd.groupID}:${cmd.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}
		`);
	})
	.on('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}
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

client.login(config.token);

async function sendAbalStats(): Promise<any> {
	const body: { server_count: number } = { server_count: client.guilds.size }; // eslint-disable-line camelcase

	try {
		await request({
			method: 'POST',
			uri: `${config.abalURL}/bots/${client.user.id}/stats`,
			headers: { Authorization: config.abalKey },
			body,
			json: true
		});

		winston.info(`Sent guild count to bots.discord.pw with ${client.guilds.size} guilds.`);
	} catch (error) {
		winston.error('Error while sending guild count to bots.discord.pw.', error);
	}
}
