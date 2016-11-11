const { Command } = require('discord.js-commando');
const winston = require('winston');

const { redis } = require('../../redis/redis');
const TagModel = require('../../mongoDB/models/Tag');

module.exports = class TagCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag',
			group: 'tags',
			memberName: 'tag',
			description: 'Displays a Tag.',
			format: '<tagname>',
			guildOnly: true,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What Tag would you like to see?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		return this.findTagCached(msg, name, msg.guild.id);
	}

	async findTagCached(msg, name, guildID) {
		redis.get(name + guildID, (err, reply) => {
			winston.log('getting stuff from redis...');
			if (err) return winston.error(err);
			if (reply) {
				TagModel.incrementUses(name, guildID);
				return msg.say(reply);
			} else {
				winston.log('nope, nothing in cache, getting stuff from DB');
				return TagModel.get(name, guildID).then(tag => {
					if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
					return TagModel.incrementUses(name, guildID).then(() => msg.say(tag.content));
				}).catch(error => { winston.error(error); });
			}
		});
	}
};
