'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class Snowflake extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'snowflake',
			description: 'generate a new snowflake',
			group: 'utility',
			usage: '<timestamp>',
			args: [{
				name: '<timestamp>',
				optional: true,
				description: 'timestamp during the Discord epoch (1st Jan 2015)',
				defaultValue: 'current timestamp',
				example: '1596779518569',
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel } = message;
		const now = !args[0] ? Date.now() : new Date(parseInt(args[0])).getTime();

		if (Number.isNaN(now) || !Number.isSafeInteger(now) || now < 1420070400000) {
			return channel.send('Please provide a valid timestamp!');
		}

		return channel.send(client.snowflake(now));
	}
};
