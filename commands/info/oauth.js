const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const config = require('../../settings');

module.exports = class AboutCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'oauth',
			aliases: ['invite'],
			group: 'info',
			memberName: 'oauth',
			description: 'The link to add Hamakaze to a server.'
		});
	}

	async run(msg) {
		if (!config.OAuthLink) {
			return msg.say(`I don't have an invite link for you at the moment. Sorry, ${msg.author}.`);
		}
		return msg.say(`Use this to add me to a server, ${msg.author}:
			${config.OAuthLink}
			Make sure you are logged in!
		`);
	}
};
