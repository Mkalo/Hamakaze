import { oneLine } from 'common-tags';
import { EvaluatedPermissions, Guild, GuildMember, Message, StreamDispatcher, TextChannel, Util, VoiceChannel, VoiceConnection } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'request-promise';
import * as winston from 'winston';

const youTube: any = require('simple-youtube-api');
const ytdl: any = require('ytdl-core');

import Song from '../../structures/song';
import { vote } from './skip';

const { defaultVolume, googleAPIKey, maxLength, maxSongs, passes, soundcloudID }: { defaultVolume: string, googleAPIKey: string, maxLength: string, maxSongs: string, passes: number, soundcloudID: string } = require('../../settings');
const { version }: { version: string } = require('../../../package');

export type queue = {
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	connection: VoiceConnection;
	songs: song[];
	volume: number;
};

type video = {
	id: string | number;
	title: string;
	durationSeconds: number;
};

export type song = {
	name: string;
	id: string | number;
	length: number;
	member: GuildMember;
	dispatcher: any;
	playing: boolean;
	url: string;
	thumbnail: string;
	username: string;
	avatar: string;
	lengthString: string;
	timeLeft: Function;
};

export default class PlaySongCommand extends Command {
	public queue: Map<string, queue>;
	public youtube: any;
	private _votes: Map<string, vote>;

	constructor(client: CommandoClient) {
		super(client, {
			name: 'play',
			group: 'music',
			memberName: 'play',
			description: 'Adds a song to the queue.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'url',
					prompt: 'what music would you like to listen to?\n',
					type: 'string'
				}
			]
		});

		this.queue = new Map();
		this.youtube = new youTube(googleAPIKey);
	}

	public async run(msg: CommandMessage, args: { url: string }): Promise<Message | Message[]> {
		const url: string = args.url.replace(/<(.+)>/g, '$1');
		const queue: queue = this.queue.get(msg.guild.id);

		let voiceChannel: VoiceChannel;
		if (!queue) {
			voiceChannel = msg.member.voiceChannel;
			if (!voiceChannel) return msg.reply('you aren\'t in a voice channel.');

			const permissions: EvaluatedPermissions = voiceChannel.permissionsFor(msg.client.user);
			if (!permissions.hasPermission('CONNECT')) {
				return msg.reply('I don\'t have permission to join your voice channel. No parties allowed there.');
			} else if (!permissions.hasPermission('SPEAK')) {
				return msg.reply('I don\'t have permission to speak in your voice channel.');
			}
		} else if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.reply('you\'re not in the voice channel.');
		}

		const statusMsg: Message | Message[] = await msg.reply('obtaining video details...');

		if (url.match(/^https?:\/\/(soundcloud.com|snd.sc)\/(.*)$/)) {
			try {
				const video: video = await request({
					uri: `http://api.soundcloud.com/resolve.json?url=${url}&client_id=${soundcloudID}`,
					headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
					json: true
				});

				return this._handleVideo(video, queue, voiceChannel, msg, (statusMsg as Message));
			} catch (error) {
				winston.error(`${error.statusCode}: ${error.statusMessage}`);

				return (statusMsg as Message).edit(`${msg.author}, ❌ This track is not able to be streamed by SoundCloud.`);
			}
		} else {
			return this.youtube.getVideo(url).then((video: video) => {
				this._handleVideo(video, queue, voiceChannel, msg, (statusMsg as Message));
			}).catch((): void => {
				this.youtube.searchVideos(url, 1).then((videos: { id: string }[]) => {
					this.youtube.getVideoByID(videos[0].id).then((video2: video) => {
						this._handleVideo(video2, queue, voiceChannel, msg, (statusMsg as Message));
					}).catch((error: Error) => {
						winston.error(`${error}`);
						(statusMsg as Message).edit(`${msg.author}, couldn't obtain the search result video's details.`);
					});
				}).catch((): Promise<Message> => (statusMsg as Message).edit(`${msg.author}, there were no search results.`));
			});
		}
	}

	private async _handleVideo(video: { id: string | number, title: string, durationSeconds: number }, queue: queue, voiceChannel: VoiceChannel, msg: CommandMessage, statusMsg: Message): Promise<Message | Message[]> {
		if (video.durationSeconds === 0) return statusMsg.edit(`${msg.author}, you can't play livestreams.`);

		if (!queue) {
			queue = {
				textChannel: (msg.channel as TextChannel),
				voiceChannel,
				connection: null,
				songs: [],
				volume: this.client.provider.get(msg.guild.id, 'defaultVolume', defaultVolume)
			};
			this.queue.set(msg.guild.id, queue);

			const result: string = await this._addSong(msg, video);
			const resultMessage: object = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: msg.author.displayAvatarURL
				},
				description: result
			};

			if (!result.startsWith('👍')) {
				this.queue.delete(msg.guild.id);

				return statusMsg.edit('', { embed: resultMessage });
			}

			statusMsg.edit(`${msg.author}, joining your voice channel...`);
			try {
				const connection: VoiceConnection = await queue.voiceChannel.join();
				queue.connection = connection;
				this._play(msg.guild, queue.songs[0]);
				statusMsg.delete();
			} catch (error) {
				winston.error('Error occurred when joining voice channel.', error);
				this.queue.delete(msg.guild.id);
				statusMsg.edit(`${msg.author}, unable to join your voice channel.`);
			}
		} else {
			const result: string = await this._addSong(msg, video);
			const resultMessage: object = {
				color: 3447003,
				author: {
					name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					icon_url: msg.author.displayAvatarURL
				},
				description: result
			};

			statusMsg.edit('', { embed: resultMessage });
		}
	}

	private _addSong(msg: CommandMessage, video: { id: string | number, title: string, durationSeconds: number }): string {
		const queue: queue = this.queue.get(msg.guild.id);

		if (!this.client.isOwner(msg.author)) {
			const songMaxLength: number = this.client.provider.get(msg.guild.id, 'maxLength', maxLength);
			if (songMaxLength > 0 && video.durationSeconds > songMaxLength * 60) {
				return oneLine`
					👎 ${Util.escapeMarkdown(video.title)}
					(${Song.timeString(video.durationSeconds)})
					is too long. No songs longer than ${maxLength} minutes!
				`;
			} else if (queue.songs.some((song: { id: string | number }) => song.id === video.id)) {
				return `👎 ${Util.escapeMarkdown(video.title)} is already queued.`;
			}

			const queueMaxSongs: number = this.client.provider.get(msg.guild.id, 'maxSongs', maxSongs);
			if (queueMaxSongs > 0 && queue.songs.reduce((prev: number, song: song) => prev + Number(song.member.id === msg.author.id), 0) >= queueMaxSongs) {
				return `👎 you already have ${queueMaxSongs} songs in the queue!`;
			}
		}

		winston.info('Adding song to queue.', { song: video.id, guild: msg.guild.id });
		const song: song = new Song(video, msg.member);
		queue.songs.push(song);

		return `👍 ${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song.name}` : `[${song.name}](${`${song.url}`})`}`;
	}

	private _play(guild: Guild, song: song): void {
		const queue: queue = this.queue.get(guild.id);
		const vote: any = this.votes.get(guild.id);

		if (vote) {
			clearTimeout(vote);
			this.votes.delete(guild.id);
		}

		if (!song) {
			queue.textChannel.send('We\'ve run out of songs! Better queue up some more tunes.');
			queue.voiceChannel.leave();
			this.queue.delete(guild.id);

			return;
		}

		const playingMessage: {} = {
			color: 3447003,
			author: {
				name: song.username,
				icon_url: song.avatar
			},
			description: `${song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/) ? `${song.name}` : `[${song.name}](${`${song.url}`})`}`,
			image: { url: song.thumbnail }
		};

		const playing: Promise<Message | Message[]> = queue.textChannel.send('', { embed: playingMessage });
		let stream: any;
		let streamErrored: boolean = false;

		if (song.url.match(/^https?:\/\/(api.soundcloud.com)\/(.*)$/)) {
			stream = request({ uri: song.url, headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` }, followAllRedirects: true });
		} else {
			stream = ytdl(song.url, { audioonly: true })
				.on('error', (err: Error) => {
					streamErrored = true;
					winston.error('Error occurred when streaming video:', err);
					playing.then((msg: Message) => msg.edit(`❌ Couldn't play ${song.name}. What a drag!`));
					queue.songs.shift();
					this._play(guild, queue.songs[0]);
				});
		}

		const dispatcher: StreamDispatcher = queue.connection.playStream(stream, { passes })
			.on('end', () => {
				if (streamErrored) return;
				queue.songs.shift();
				this._play(guild, queue.songs[0]);
			})
			.on('error', (err: Error) => {
				winston.error('Error occurred in stream dispatcher:', err);
				queue.textChannel.sendMessage(`An error occurred while playing the song: \`${err}\``);
			});
		dispatcher.setVolumeLogarithmic(queue.volume / 5);
		song.dispatcher = dispatcher;
		song.playing = true;
	}

	get votes(): Map<string, vote> {
		if (!this._votes) this._votes = this.client.registry.resolveCommand('music:skip').votes;

		return this._votes;
	}
}
