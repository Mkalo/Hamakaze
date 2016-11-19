const { Command } = require('discord.js-commando');
const request = require('request-promise');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const version = require('../../package').version;

module.exports = class FortuneCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'strawpoll',
			group: 'util',
			memberName: 'strawpoll',
			description: 'Create a strawpoll.',
			format: 'strawpoll \'[title]\' <option> <option> [<option> ...]',
			details: stripIndents`Create a strawpoll.
				The first argument is always the title, if you provde it, otherwise your username will be used!
				If you need to use spaces in your title make sure you put them in SingleQuotes => \`'topic here'\``,

			args: [
				{
					key: 'title',
					prompt: 'What title would you like the strawpoll to have?\n',
					type: 'string'
				},
				{
					key: 'options',
					prompt: 'What options would you like the strawpoll to have?\n',
					type: 'string',
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		let title = args.title;
		let options = args.options;

		if (options.length < 3) return;
		if (options.length > 31) return;

		request({
			method: 'POST',
			uri: `https://strawpoll.me/api/v2/polls`,
			followAllRedirects: true,
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			body: {
				title: title,
				options: options
			},
			json: true
		}).then(response => {
			return msg.say(stripIndents`🗳 ${response.title}
				<http://strawpoll.me/${response.id}>`);
		}).catch(error => { winston.error(error); });
	}
};
