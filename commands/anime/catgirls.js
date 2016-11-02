const { Command } = require('discord.js-commando');
const request = require('request-promise');

const version = require('../../package').version;

module.exports = class CatgirlCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'catgirl',
			aliases: ['nyaa', 'neko', 'catgirls'],
			group: 'fun',
			memberName: 'catgirl',
			description: 'Posts a random catgirl.'
		});
	}

	async run(msg) {
		return request({
			uri: 'http://catgirls.brussell98.tk/api/random',
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			json: true
		})
		.then(response => { return msg.say(response.url); })
		.catch(error => msg.say(`Error: Status code ${error.status || error.esponse}`));
	}
};
