'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class ToggleTags extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'toggletags',
			description: 'enable/disable tags on the server',
			group: 'tag',
			usage: '<boolean>',
			args: [{
				name: '<boolean>',
				optional: true,
				description: 'on/off',
				defaultValue: 'opposite of current status',
				example: 'off',
			}],
			aliases: ['toggletag'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;
		const _guild = guild.model;

		const boolean = args[0] ? (args[0].match(/^(on|off)$/i) || [])[1] : !_guild.tagsEnabled;
		if (boolean === undefined && args[0]) {
			return channel.send('Please provide an on/off argument!');
		}

		if (_guild.tagsEnabled !== boolean) {
			await client.db.models.Guild.q.add(guild.id, () => _guild.update({ tagsEnabled: boolean }));
		}

		return channel.send(`Tags have been ${boolean ? 'enabled' : 'disabled'} for this server.`);
	}
};
