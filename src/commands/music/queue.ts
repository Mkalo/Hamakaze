import { oneLine, stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient, util } from 'discord.js-commando';

import Song from '../../structures/Song';
import { queue, song } from './play';

const { paginationItems }: { paginationItems: number } = require('../../settings');

export default class ViewQueueCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'queue',
			aliases: ['songs', 'song-list'],
			group: 'music',
			memberName: 'queue',
			description: 'Lists the queued songs.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'page',
					prompt: 'what page would you like to view?\n',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { page: number }): Promise<Message | Message[]> {
		const { page }: { page: number } = args;
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there are no songs in the queue.');

		const paginated: { page: number, items: {}[], maxPage: number} = util.paginate(queue.songs, page, Math.floor(paginationItems));
		const totalLength: number = queue.songs.reduce((prev: number, song: song): number => prev + song.length, 0);
		const currentSong: song = queue.songs[0];
		const currentTime: number = currentSong.dispatcher ? currentSong.dispatcher.time / 1000 : 0;

		return msg.embed({
			color: 3447003,
			author: {
				name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
				icon_url: msg.author.displayAvatarURL
			},
			description: stripIndents`
				__**Song queue, page ${paginated.page}**__
				${paginated.items.map((song: song) => `**-** ${!isNaN(Number(song.id))
					? `${song.name} (${song.lengthString})`
					: `[${song.name}](${`https://www.youtube.com/watch?v=${song.id}`})`} (${song.lengthString})`).join('\n')}
				${paginated.maxPage > 1 ? `\nUse ${msg.usage()} to view a specific page.\n` : ''}

				**Now playing:** ${!isNaN(Number(currentSong.id))
					? `${currentSong.name}`
					: `[${currentSong.name}](${`https://www.youtube.com/watch?v=${currentSong.id}`})`}
				${oneLine`
					**Progress:**
					${!currentSong.playing ? 'Paused: ' : ''}${Song.timeString(currentTime)} /
					${currentSong.lengthString}
					(${currentSong.timeLeft(currentTime)} left)
				`}
				**Total queue time:** ${Song.timeString(totalLength)}
			`
		});
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as this).queue;
		return this._queue;
	}
}
