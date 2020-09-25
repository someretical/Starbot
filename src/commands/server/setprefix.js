'use strict';

const { oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class SetPrefix extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'setprefix',
			description: 'set this server\'s custom prefix',
			group: 'server',
			usage: '<prefix>',
			args: [{
				name: '<prefix>',
				optional: false,
				description: oneLine`
					maximum 10 character length, if you want to include spaces, 
					run \`<prefix>help arguments\` for more information
				`,
				example: 's!',
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
			return channel.send('Please provide a prefix!');
		}

		const sanitised = args[0].replace(/<single_quote>/ig, '\'').replace(/<double_quote>/ig, '"');

		if (sanitised.length > 10 || !args[0].length) {
			return channel.send('Please choose a prefix that is between 1 and 10 characters long!');
		}

		await client.db.models.Guild.q.add(guild.id, () => guild.model.update({ prefix: sanitised }));

		return channel.send(oneLine`
			The prefix for this guild has been updated to \`${sanitised}\`.
			If you forget the custom prefix, you can still run commands with the ${client.user.toString()} prefix.
		`);
	}
};
