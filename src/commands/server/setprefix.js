'use strict';

const { oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class SetPrefix extends StarbotCommand {
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
		const { args, channel, guild } = message;
		const { cache, models } = message.client.db;

		if (!args[0]) {
			return channel.embed('Please choose a prefix!');
		}

		const sanitised = args[0].replace(/<single_quote>/ig, '\'').replace(/<double_quote>/ig, '"');

		if (sanitised.length > 10 || !args[0].length) {
			return channel.embed('Please choose a prefix that is between 1 and 10 characters long!');
		}

		const upsertObj = guild.settings.toJSON();
		upsertObj.prefix = sanitised;

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(oneLine`
			The prefix for this guild has been updated to \`${sanitised}\`.
			You can still mention the bot to run commands if you forget the custom prefix.
		`);
	}
}

module.exports = SetPrefix;
