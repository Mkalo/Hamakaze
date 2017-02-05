const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Tag = require('../../postgreSQL/models/Tag');

module.exports = class TagListCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-list',
			aliases: ['tags', 'list-tag'],
			group: 'tags',
			memberName: 'list',
			description: 'Lists all server tags.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		let tags = await Tag.findAll({ where: { guildID: msg.guild.id } });
		if (!tags) return msg.say(`${msg.guild.name} doesn't have any tags, ${msg.author}. Why not add one?`);

		return msg.say(stripIndents`**❯ Tags:**
			${tags.map(tag => tag.name).sort().join(', ')}
		`);
	}
};
