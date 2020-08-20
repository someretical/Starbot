'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

class RepCount extends StarbotCommand {
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

	async run(message) {
		const { client, author, channel, args } = message;
		const invalid = () => channel.embed('Please provide a valid user resolvable!');
		let user = null;

		if (!args[0]) return invalid();

		try {
			user = await client.users.fetch(!args[0] ? author.id : matchUsers(args[0])[0]);
		} catch (err) {
			return invalid();
		}

		if (!user) return invalid();

		await user.add();

		const text = user.id === author.id ? 'You have' : `${user.toString()} has`;
		return channel.embed(`${text} ${user.data.reputation} reputation.`);
	}
}

module.exports = RepCount;
