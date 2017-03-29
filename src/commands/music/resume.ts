import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { queue } from './play';

export default class ResumeSongCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'resume',
			group: 'music',
			memberName: 'resume',
			description: 'Resumes the currently playing song.',
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

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply(`there isn't any music playing to resume.`);
		if (!queue.songs[0].dispatcher) return msg.reply('I can\'t resume a song that hasn\'t actually begun playing yet.');
		if (queue.songs[0].playing) return msg.reply('Resuming a song that isn\'t paused is a great move.');
		queue.songs[0].dispatcher.resume();
		queue.songs[0].playing = true;

		return msg.reply('resumed the music.');
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as this).queue;

		return this._queue;
	}
}
