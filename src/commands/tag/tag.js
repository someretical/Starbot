'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class Tag extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'tag',
			description: 'enable/disable tags on the server',
			group: 'tag',
			usage: '<boolean>',
			args: [{
				name: '<boolean>',
				optional: false,
				description: 'a literal boolean, `enable` or `disable`',
				example: 'enable',
				code: true,
			}],
			aliases: [],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;

		if (!args[0]) {
			return channel.embed('Please provide a boolean resolvable!');
		}

		let boolean = (args[0].match(/^(e(?:nabled?)?|d(?:isabled?)|true|false|1|0)$/i) || [])[1];
		if (!boolean) {
			return channel.embed('Please provide a valid boolean resolvable!');
		}

		boolean = Boolean(/^e(?:nabled?)?$/i.test(boolean) ? true : /^d(?:isabled?)?$/i.test(boolean) ? false : boolean);

		const [updatedGuild] = await guild.queue(() => client.db.models.Guild.upsert({
			id: guild.id,
			tagsEnabled: boolean,
		}));

		client.db.cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`Tags have been ${boolean ? 'enabled' : 'disabled'} for this server.`);
	}
};
