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
		let embed = {
			color: 3447003,
			author: {
				name: `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
				icon_url: msg.author.avatarURL ? msg.author.avatarURL : this.client.user.avatarURL // eslint-disable-line camelcase
			},
			description: stripIndents`
				<Hamakaze>

				# CREATOR: [Crawl#3280 (ID: 81440962496172032)]
				# LIBRARY: [Discord.js [v${discordversion}]
				# VERSION: [v${version}]

				* **Hamakaze is a multipurpose bot.**
				* **If you have any suggestions or feedback head over to her server**
				* **You can see her commands by doing @${msg.client.user.username}#${msg.client.user.discriminator} help**

				# WEBSITE: [https://hamakaze.moe]
				# SERVER:  [https://discord.gg/RtsZNk4]
			`,
			timestamp: new Date(),
			footer: {
				icon_url: this.client.user.avatarURL, // eslint-disable-line camelcase
				text: 'About'
			}
		};
		return msg.embed(embed);
	}
};
