const { Command } = require('discord.js-commando');
const discordversion = require('discord.js').version;
const stripIndents = require('common-tags').stripIndents;

const version = require('../../package').version;

module.exports = class AboutCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'about',
			group: 'info',
			memberName: 'about',
			description: 'Displays statistics about the bot.'
		});
	}

	async run(msg) {
		return msg.embed({
			color: 3447003,
			description: stripIndents`
				**Hamakaze**

				**❯ CREATOR:** <@${this.client.options.owner}> (ID: ${this.client.options.owner})
				**❯ LIBRARY:** Discord.js v${discordversion}
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
};
