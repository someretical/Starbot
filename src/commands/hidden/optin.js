'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class OptIn extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'optin',
			description: 'globally unblock someone',
			group: 'hidden',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'a globally blocked user mention or a valid ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['opt-in'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: true,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel } = message;
		const ignored = client.db.cache.GlobalIgnore.get(matchUsers(args[0])[0]);

		if (!ignored) {
			channel.embed(`<@${ignored.user_id}> is not blocked!`);
			return;
		}

		await ignored.destroy();

		client.db.cache.GlobalIgnore.delete(ignored.user_id);

		await channel.embed(`<@${ignored.user_id}> has been globally unblocked.`);
	}
};
