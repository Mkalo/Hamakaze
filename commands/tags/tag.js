const { Command } = require('discord.js-commando');

const { redis } = require('../../redis/redis');
const Tag = require('../../postgreSQL/models/Tag');

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
		return redis.getAsync(name + guildID).then(async reply => {
			if (reply !== 'undefined') {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (tag) tag.increment('uses');

				return msg.say(reply);
			} else {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
				tag.increment('uses');

				return redis.set(name + guildID, tag.content, () => { msg.say(tag.content); });
			}
		});
	}
};
