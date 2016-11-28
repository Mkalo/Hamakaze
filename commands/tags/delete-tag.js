const { Command } = require('discord.js-commando');
const winston = require('winston');

const { redis } = require('../../redis/redis');
const Tag = require('../../postgreSQL/models/Tag');

module.exports = class TagDeleteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'delete-tag',
			aliases: ['tag-del', 'del-tag'],
			group: 'tags',
			memberName: 'tag-delete',
			description: 'Deletes a Tag.',
			format: '<tagname>',
			guildOnly: true,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What Tag would you like to delete?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		let tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
		if (tag.userID !== msg.author.id || msg.guild.owner.id !== msg.author.id || msg.author.id !== '81440962496172032') return msg.say(`You can only delete your own tags, ${msg.author}`);

		return Tag.sync()
			.then(() => {
				Tag.destroy({ where: { name, guildID: msg.guild.id } });

				redis.delAsync(name + msg.guild.id);

				return msg.say(`The tag **${name}** has been deleted, ${msg.author}`);
			})
			.catch(error => { winston.error(error); });
	}
};
