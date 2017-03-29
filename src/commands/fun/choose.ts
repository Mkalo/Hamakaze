import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';

const RESPONSES: Function[] = [
	(ch: string) => `I choose **${ch}**`,
	(ch: string) => `I pick **${ch}**`,
	(ch: string) => `**${ch}** is the best choice`,
	(ch: string) => `**${ch}** is my choice`,
	(ch: string) => `**${ch}** of course`
];

export default class ChooseCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'choose',
			aliases: ['pick', 'decide'],
			group: 'fun',
			memberName: 'choose',
			description: 'Makes a choice for you.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'choices',
					prompt: 'what I should choose from?\n',
					type: 'string',
					infinite: true
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { choices: string[] }): Promise<Message | Message[]> {
		const { choices }: { choices: string[] } = args;

		if (choices.length < 2) return msg.reply(`You need to tell me atleast 2 things to choose from, ${msg.author}`);

		let userError: boolean = false;
		choices.forEach((ch: string) => {
			if (/[,|;|\||/|//|\-]/.test(ch) && ch.length >= 2) userError = true;
		});
		if (userError) return msg.reply(`please seperate your choices with a simple space.`);

		let pick: number = Math.floor(Math.random() * choices.length);
		choices.forEach((ch: string, i: number) => {
			if ((ch.includes('homework')
				|| ch.includes('sleep')
				|| ch.includes('study')
				|| ch.includes('productiv')
				|| ch.includes('shower'))
			&& Math.random() < 0.3) {
				pick = i;
			}
		});

		return msg.say(`${RESPONSES[Math.floor(Math.random() * RESPONSES.length)](choices[pick])}, ${msg.author}.`);
	}
}
