import { stripIndents } from 'common-tags';
import { Message, version as discordjsVersion } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const { version }: { version: string } = require('../../../package');

export default class AboutCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'about',
			group: 'info',
			memberName: 'about',
			description: 'Displays statistics about the bot.',
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.embed({
			color: 3447003,
			description: stripIndents`
				**Hamakaze**

				**❯ CREATOR:** <@${this.client.options.owner}> (ID: ${this.client.options.owner})
				**❯ LIBRARY:** Discord.js v${discordjsVersion}
				**❯ VERSION:** v${version}

				**Hamakaze is a multipurpose bot.**
				**If you have any suggestions or feedback head over to her server.**
				**You can see her commands by via ${this.client.user} help**

				**❯ WEBSITE:** WIP
				**❯ SERVER:**  https://discord.gg/RtsZNk4
			`,
			thumbnail: { url: this.client.user.avatarURL }
		});
	}
}
