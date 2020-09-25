'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class Rep extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'rep',
			description: 'give someone one reputation',
			group: 'utility',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'a user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['addrep'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel, command } = message;

		if (await command.checkThrottle(message, 'addcoins')) return undefined;

		if (!args[0]) {
			return channel.send('Please provide a user resolvable!');
		}

		const user = client.db.models.User.cache.get(matchUsers(args[0])[0]);
		if (!user) {
			return channel.send('This user has not been added yet.');
		}

		if (user.id === author.id) {
			return channel.send('You cannot give yourself reputation!');
		}

		await client.db.models.User.q.add(user.id, () => user.update({ reputation: user.reputation + 1 }));

		await channel.embed(`You have given <@${user.id}> one reputation.`);
		return command.customThrottle(message, 'rep', 86400000);
	}
};
