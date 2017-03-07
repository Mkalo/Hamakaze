import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import Song from '../../structures/song';
import { queue, song } from './play';

export default class StopMusicCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'status',
			aliases: ['song', 'playing', 'current-song', 'now-playing'],
			group: 'music',
			memberName: 'status',
			description: 'Shows the current status of the music.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t any music playing right now.');
		const song: song = queue.songs[0];
		const currentTime: number = song.dispatcher ? song.dispatcher.time / 1000 : 0;

		return msg.embed({
			color: 3447003,
			author: {
				name: song.username,
				icon_url: song.avatar
			},
			description: stripIndents`
				${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song.name}` : `[${song.name}](${`${song.url}`})`}

				We are ${Song.timeString(currentTime)} into the song, and have ${song.timeLeft(currentTime)} left.
				${!song.playing ? 'The music is paused.' : ''}
			`,
			image: { url: song.thumbnail }
		});
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
}
