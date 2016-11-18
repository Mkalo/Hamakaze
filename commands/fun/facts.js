const { Command } = require('discord.js-commando');
const request = require('request-promise');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const version = require('../../package').version;

const types = ['math', 'date', 'year', 'trivia'];

module.exports = class FactsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'facts',
			aliases: ['fact'],
			group: 'fun',
			memberName: 'facts',
			description: 'Get facts about a number, date, or cats.',
			format: '[random <math|date|year|trivia> | number <num> | math <num> | date <MM/DD> | year <year> | cats]',
			details: stripIndents`Get facts about cats, a number, date, year, or math facts on a number.
				Formats: \`random trivia\` \`number 42\` \`math 42\` \`date 7/17\` \`year 1777\``,
			argsType: 'multiple',
			argsCount: 2,

			args: [
				{
					key: 'category',
					prompt: 'What category would you like to get a fact on?\n',
					type: 'string'
				},
				{
					key: 'subcategory',
					prompt: 'What subcategory would you like to get a fact on?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const category = args.category;
		const subcategory = args.subcategory;

		if (category === 'random') {
			return this.getRandom(msg, subcategory);
		} else if (category === 'number') {
			return this.getFact(msg, subcategory, 'trivia');
		} else if (category === 'math') {
			return this.getFact(msg, subcategory, 'math');
		} else if (category === 'date') {
			return this.getFact(msg, subcategory, 'date');
		} else if (category === 'year') {
			return this.getFact(msg, subcategory, 'year');
		} else if (category === 'cat') {
			return this.getCat(msg);
		}
		return msg.say(`WRONG!`);
	}

	async getRandom(msg, subcategory) {
		let type = subcategory ? types.includes(subcategory) ? subcategory : types[Math.floor(Math.random() * types.length)] : types[Math.floor(Math.random() * types.length)];
		return request({
			uri: `http://numbersapi.com/random/${type}`,
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			json: true
		}).then(response => { return msg.say(response); }).catch(error => { winston.error(error); });
	}

	async getFact(msg, number, type) {
		if (number) {
			return request({
				uri: `http://numbersapi.com/${number}/${type}`,
				headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
				json: true
			}).then(response => { return msg.say(response); }).catch(error => { winston.error(error); });
		}
		return msg.reply(`you need to supply a number. Maybe you want \`facts random ${type}\`?`);
	}

	async getCat(msg) {
		return request({
			uri: 'http://catfacts-api.appspot.com/api/facts',
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			json: true
		}).then(response => {
			return msg.say(stripIndents`🐱 **${msg.author}, did you know:**
				${response.facts[0]}`);
		}).catch(error => { winston.error(error); });
	}
};
