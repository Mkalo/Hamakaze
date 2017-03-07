import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import { queue, song } from './play';

export default class SaveQueueCommand extends Command {
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'save',
			aliases: ['save-songs', 'save-song-list'],
			group: 'music',
			memberName: 'save',
			description: 'Sends you a DM with the currently playing song.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t any music playing right now. You should get on that.');
		const song: song = queue.songs[0];

		msg.reply('✔ Check your inbox!');

		return msg.author.sendEmbed({
			color: 3447003,
			author: {
				name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
				icon_url: msg.author.displayAvatarURL
			},
			description: stripIndents`
				**Currently playing:**
				${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song.name}` : `[${song.name}](${`${song.url}`})`}
				${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? 'A SoundCloud song is currently playing.' : ''}
			`,
			image: { url: song.thumbnail }
		});
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
}
