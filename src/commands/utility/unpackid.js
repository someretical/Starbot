'use strict';

const moment = require('moment');
const { SnowflakeUtil } = require('discord.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class UnpackID extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unpackid',
			description: 'unpack a snowflake',
			group: 'utility',
			usage: '<snowflake>',
			args: [{
				name: '<snowflake>',
				optional: false,
				description: 'a discord ID',
				example: client.owners[0],
			}],
			aliases: ['unpacksnowflake'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel } = message;

		if (!args[0] || /[\D]/.test(args[0])) {
			return channel.embed('Please provide a valid ID!');
		}

		const { date, workerID, processID, increment, binary } = SnowflakeUtil.deconstruct(args[0]);
		const formattedSnowflake = args[0].length > 30 ? `${args[0].substr(0, 27)}...` : args[0];
		const embed = client.embed(null, true)
			.setTitle(`Details for snowflake ${formattedSnowflake}`)
			.addField('Date', moment(date).format('dddd, MMMM Do YYYY, h:mm:ss a'))
			.addField('Binary', `\`${binary}\``)
			.addField('Worker ID', workerID, true)
			.addField('Process ID', processID, true)
			.addField('Increment', increment, true);

		return channel.send(embed);
	}
};
