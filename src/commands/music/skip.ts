import { oneLine } from 'common-tags';
import { Guild, Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

import { queue, song } from './play';

export type vote = {
	count: number;
	users: string[];
	queue: queue;
	guild: string;
	start: number;
	timeout: NodeJS.Timer;
};

export default class SkipSongCommand extends Command {
	public votes: Map<string, vote>;
	private _queue: Map<string, queue>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'skip',
			group: 'music',
			memberName: 'skip',
			description: 'Skips the song that is currently playing.',
			details: oneLine`
				If there are 3 people or fewer (excluding the bot) in the voice channel, the skip will be immediate.
				With at least 4 people, a voteskip will be started with 15 seconds to accept votes.
				The required votes to successfully skip the song is one-third of the number of listeners, rounded up.
				Each vote will add 5 seconds to the vote's timer.
				Moderators can use the "force" parameter, which will immediately skip without a vote, no matter what.
			`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});

		this.votes = new Map();
	}

	public run(msg: CommandMessage, args: any): Promise<Message | Message[]> {
		const queue: queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t a song playing right now.');
		if (!queue.voiceChannel.members.has(msg.author.id)) return msg.reply('you\'re not in the voice channel.');
		if (!queue.songs[0].dispatcher) return msg.reply('the song hasn\'t even begun playing yet.');

		const threshold: number = Math.ceil((queue.voiceChannel.members.size - 1) / 3);
		const force: boolean = threshold <= 1
			|| queue.voiceChannel.members.size < threshold
			|| (msg.member.hasPermission('MANAGE_MESSAGES')
			&& args.toLowerCase() === 'force');
		if (force) return msg.reply(this._skip(msg.guild, queue));

		const vote: vote = this.votes.get(msg.guild.id);
		if (vote && vote.count >= 1) {
			if (vote.users.some((user: string) => user === msg.author.id)) return msg.reply('you\'ve already voted to skip the song.');

			vote.count++;
			vote.users.push(msg.author.id);
			if (vote.count >= threshold) return msg.reply(this._skip(msg.guild, queue));

			const time: number = this._setTimeout(vote);
			const remaining: number = threshold - vote.count;
			return msg.say(oneLine`
					${vote.count} vote${vote.count > 1 ? 's' : ''} received so far,
					${remaining} more ${remaining > 1 ? 'are' : 'is'} needed to skip.
					Five more seconds on the clock! The vote will end in ${time} seconds.
				`);
		} else {
			const newVote: vote = {
				count: 1,
				users: [msg.author.id],
				queue,
				guild: msg.guild.id,
				start: Date.now(),
				timeout: null
			};
			const time: number = this._setTimeout(newVote);
			this.votes.set(msg.guild.id, newVote);
			const remaining: number = threshold - 1;

			return msg.say(oneLine`
					Starting a voteskip.
					${remaining} more vote${remaining > 1 ? 's are' : ' is'} required for the song to be skipped.
					The vote will end in ${time} seconds.
				`);
		}
	}

	private _skip(guild: Guild, queue: queue): string {
		if (this.votes.has(guild.id)) {
			clearTimeout(this.votes.get(guild.id).timeout);
			this.votes.delete(guild.id);
		}

		const song: song = queue.songs[0];
		song.dispatcher.end();
		return `Skipped: **${song.name}**`;
	}

	private _setTimeout(vote: vote): number {
		const time: number = vote.start + 15000 - Date.now() + ((vote.count - 1) * 5000);
		clearTimeout(vote.timeout);
		vote.timeout = setTimeout(() => {
			this.votes.delete(vote.guild);
			vote.queue.textChannel.sendMessage('The vote to skip the current song has ended.');
		}, time);
		return Math.round(time / 1000);
	}

	get queue(): Map<string, queue> {
		if (!this._queue) this._queue = (this.client.registry.resolveCommand('music:play') as this).queue;
		return this._queue;
	}
}
