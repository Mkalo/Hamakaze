import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class CoinflipCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'coinflip',
			aliases: ['coin', 'flip'],
			group: 'fun',
			memberName: 'coinflip',
			description: 'Flip a coin.',
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	public async run(msg: CommandMessage): Promise<Message | Message[]> {
		return msg.say(`I flipped a coin for you and it landed on ${Math.random() < 0.5
			? '**heads**'
			: '**tails**'}, ${msg.author}.`);
	}
}
