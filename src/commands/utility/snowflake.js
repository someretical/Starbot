'use strict';

const { SnowflakeUtil } = require('discord.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class Snowflake extends StarbotCommand {
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
		const { channel, args } = message;
		const now = !args[0] ? Date.now() : new Date(Number(args[0])).getTime();

		if (Number.isNaN(now) || now < 1420070400000) {
			return channel.embed('Please provide a valid timestamp!');
		}

		return channel.embed(SnowflakeUtil.generate(now));
	}
}

module.exports = Snowflake;
