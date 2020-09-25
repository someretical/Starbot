'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class RepCount extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'repcount',
			description: 'get a user\'s reputation count',
			group: 'info',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'a user mention or ID',
				defaultValue: 'message author',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['reputationcount'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, author, channel } = message;

		if (!args[0]) {
			return channel.send('Please provide a valid user resolvable!');
		}

		const user = client.db.models.User.cache.get(!args[0] ? author.id : matchUsers(args[0])[0]);
		if (!user) {
			return channel.send('The bot has not yet created a record for the specified user.');
		}

		const text = user.id === author.id ? 'You have' : `<@${user.id}> has`;
		return channel.embed(`${text} ${user.data.reputation} reputation.`);
	}
};
