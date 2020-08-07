'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class DeleteTag extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'deletetag',
			description: 'delete a custom command on a server',
			group: 'tag',
			usage: '<tag>',
			args: [{
				name: '<tag>',
				optional: false,
				description: 'the name of the tag',
				example: 'hi',
			}],
			aliases: ['removetag'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, channel, guild, args, member } = message;

		if (!args[0]) {
			return channel.embed('Please provide a tag name!');
		}

		const tag = guild.tags.get(guild.id + args[0].toLowerCase());

		if (!tag) {
			return channel.embed('That tag does not exist!');
		}

		if (tag.creator_id !== member.id && !member.permissions.has('ADMINISTRATOR') && !client.isOwner(member.id)) {
			return channel.embed('Only an administrator can delete tags that they did not create!');
		}

		await guild.queue(() => tag.destroy());

		this.client.db.cache.Tag.delete(guild.id + args[0].toLowerCase());

		return channel.embed(`The tag \`${args[0].toLowerCase()}\` has been deleted.`);
	}
}

module.exports = DeleteTag;
