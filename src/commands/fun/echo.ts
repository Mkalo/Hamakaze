import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

export default class EchoCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'echo',
			aliases: ['say', 'repeat'],
			group: 'fun',
			memberName: 'echo',
			description: 'Repeats your message.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'message',
					prompt: 'what would you like me to say?\n',
					type: 'string',
					default: '',
					max: 1800
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { message: string }): Promise<Message | Message[]> {
		const { message }: { message: string } = args;
		msg.delete();
		return msg.say(message);
	}
}
