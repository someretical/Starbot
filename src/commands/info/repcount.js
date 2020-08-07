'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

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
				example: `<@!${client.owners[0]}>`,
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
		const id = args[0] ? (args[0].match(/^(?:<@!?)?(\d+)>?$/) || [])[1] : author.id;

		if (!id) return invalid();

		let user = null;
		try {
			user = await client.users.fetch(id);
		} catch (err) {
			return invalid();
		}
		if (!user) return invalid();

		await user.add();

		const text = id === author.id ? 'You have' : `${user.toString()} has`;
		return channel.embed(`${text} ${user.data.reputation} reputation.`);
	}
}

module.exports = RepCount;
