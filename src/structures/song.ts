import { oneLineTrim } from 'common-tags';
import { GuildMember, Util } from 'discord.js';

const { soundcloudID } = require('../settings');

export default class Song {
	private static _timeString(seconds: number, forceHours = false): string {
		const hours: number = Math.floor(seconds / 3600);
		const minutes: number = Math.floor(seconds % 3600 / 60);

		return oneLineTrim`
			${forceHours || hours >= 1 ? `${hours}:` : ''}
			${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:
			${`0${Math.floor(seconds % 60)}`.slice(-2)}
		`;
	}

	public name: string;
	public id: string | number;
	public length: number;
	public member: GuildMember;
	public dispatcher: any;
	public playing: boolean;

	// tslint:disable-next-line:ter-max-len
	constructor(video: { title: string, id: string | number, duration: string, durationSeconds: string }, member: GuildMember) {
		this.name = Util.escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds ? parseInt(video.durationSeconds) : parseInt(video.duration) / 1000;
		this.member = member;
		this.dispatcher = null;
		this.playing = false;
	}

	get url(): string {
		// tslint:disable-next-line:ter-max-len
		if (!isNaN(Number(this.id))) return `https://api.soundcloud.com/tracks/${this.id}/stream?client_id=${soundcloudID}`;
		else return `https://www.youtube.com/watch?v=${this.id}`;
	}

	get thumbnail(): string {
		const thumbnail: string = `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
		return thumbnail;
	}

	get username(): string {
		const name: string = `${this.member.user.username}#${this.member.user.discriminator} (${this.member.user.id})`;
		return Util.escapeMarkdown(name);
	}

	get avatar(): string {
		const avatar: string = `${this.member.user.displayAvatarURL}`;
		return avatar;
	}

	get lengthString(): string {
		return Song._timeString(this.length);
	}

	public timeLeft(currentTime: number): string {
		return Song._timeString(this.length - currentTime);
	}

	private toString(): string {
		return `${this.name} (${this.lengthString})`;
	}
}
