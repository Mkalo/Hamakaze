import { stripIndents } from 'common-tags';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as request from 'request-promise';

const { version }: { version: string } = require('../../../package');

const types: string[] = ['math', 'date', 'year', 'trivia'];

export default class FactsCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'facts',
			aliases: ['fact'],
			group: 'anime',
			memberName: 'facts',
			description: 'Get facts about a number, date, or cats.',
			format: '[rng <math|date|year|trivia> | number <num> | math <num> | date <MM/DD> | year <YYYY> | cat(s)]',
			details: stripIndents`Get facts about cats, a number, date, year, or math facts on a number.
				Formats: \`rng trivia\` \`number 42\` \`math 42\` \`date 7/17\` \`year 1777\``,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'category',
					prompt: 'what category would you like to get a fact on?\n',
					type: 'string'
				},
				{
					key: 'subcategory',
					prompt: 'what subcategory would you like to get a fact on?\n',
					type: 'string',
					default: ''
				}
			]
		});
	}

	// tslint:disable-next-line:ter-max-len
	public async run(msg: CommandMessage, args: { category: string, subcategory: string }): Promise<Message | Message[]> {
		const { category, subcategory }: { category: string, subcategory: string } = args;

		if (category === 'random' || category === 'rng') {
			return this._getRandom(msg, subcategory);
		} else if (category === 'number') {
			return this._getFact(msg, subcategory, 'trivia');
		} else if (category === 'math') {
			return this._getFact(msg, subcategory, 'math');
		} else if (category === 'date') {
			return this._getFact(msg, subcategory, 'date');
		} else if (category === 'year') {
			return this._getFact(msg, subcategory, 'year');
		} else if (category === 'cat' || category === 'cats') {
			return this._getCat(msg);
		}
	}

	private async _getRandom(msg: CommandMessage, subcategory: string): Promise<Message | Message[]> {
		const type: string = subcategory
		? types.includes(subcategory)
		? subcategory
		: types[Math.floor(Math.random() * types.length)]
		: types[Math.floor(Math.random() * types.length)];
		const response: string = await request({
			uri: `http://numbersapi.com/random/${type}`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		return msg.say(response);
	}

	// tslint:disable-next-line:ter-max-len
	private async _getFact(msg: CommandMessage, numberFact: string | number, type: string): Promise<Message | Message[]> {
		if (!numberFact) return msg.reply(`you need to supply a number. Maybe you want \`facts random ${type}\`?`);

		const response: string = await request({
			uri: `http://numbersapi.com/${numberFact}/${type}`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		return msg.say(response);
	}

	private async _getCat(msg: CommandMessage): Promise<Message | Message[]> {
		const response: { facts: {}[] } = await request({
			uri: 'http://catfacts-api.appspot.com/api/facts',
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		return msg.say(stripIndents`
			🐱 **${msg.author}, did you know:**
			${response.facts[0]}
		`);
	}
}
