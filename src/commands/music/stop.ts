import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue, song } from './play';

export default class StopMusicCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'stop',
			aliases: ['kill', 'stfu'],
			group: 'music',
			memberName: 'stop',
			description: 'Stops the music and wipes the queue.',
			details: 'Only moderators may use this command.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public hasPermission(msg: CommandMessage): boolean {
		return msg.member.hasPermission('MANAGE_MESSAGES');
	}

	public async run(msg: CommandMessage, args: any): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t any music playing right now.');
		const song: song = queue.songs[0];
		queue.songs = [];
		if (song.dispatcher) song.dispatcher.end();

		return msg.reply('you\'ve just killed the party.');
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
}
