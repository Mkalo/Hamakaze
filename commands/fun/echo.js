const { Command } = require('discord.js-commando');

module.exports = class EchoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'echo',
			group: 'fun',
			memberName: 'echo',
			description: 'Repeats your message.',
			format: '<message>',

			args: [
				{
					key: 'message',
					prompt: 'What would you like me to say?\n',
					type: 'string',
					max: 1000
				}
			]
		});
	}

	async run(msg, args) {
		msg.delete();
		return msg.say(`${args.message}`);
	}
};
