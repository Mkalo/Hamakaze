import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue } from './play';

export default class PauseSongCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'pause',
			aliases: ['shh', 'shhh', 'shhhh', 'shhhhh'],
			group: 'music',
			memberName: 'pause',
			description: 'Pauses the currently playing song.',
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

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply(`there isn't any music playing to pause.`);
		if (!queue.songs[0].dispatcher) return msg.reply('I can\'t pause a song that hasn\'t even begun playing yet.');
		if (!queue.songs[0].playing) return msg.reply('pausing a song that is already paused is a bad move.');
		queue.songs[0].dispatcher.pause();
		queue.songs[0].playing = false;

		return msg.reply(`paused the music. Use \`${this.client.commandPrefix}resume\` to continue playing.`);
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
}
