'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class DeleteTag extends StarbotCommand {
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
				code: true,
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
		const { client, args, channel, guild, member } = message;

		if (!args[0]) {
			return channel.send('Please provide a tag name!');
		}

		const tag = guild.tags.find(t => t.name === args[0].toLowerCase());
		if (!tag) {
			return channel.send('The provided tag does not exist!');
		}

		if (tag.creator_id !== member.id && !member.permissions.has('ADMINISTRATOR') && !client.isOwner(member.id)) {
			return channel.send('Only an administrator can delete tags that they did not create!');
		}

		await client.db.models.Guild.q.add(guild.id, () => tag.destroy());

		return channel.send(`The tag \`${args[0].toLowerCase()}\` has been deleted.`);
	}
};
