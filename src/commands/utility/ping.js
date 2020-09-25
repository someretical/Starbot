'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class Ping extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'ping',
			description: 'check the bot\'s ping',
			group: 'utility',
			usage: '',
			args: [],
			aliases: ['pong'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 3000,
		});
	}

	async run(message) {
		const { client, channel, createdTimestamp, editedTimestamp } = message;

		const sent = await channel.send('Pinging...');
		const heartbeat = Math.floor(client.ws.ping);
		const roundTrip = Math.floor(sent.createdTimestamp - (editedTimestamp || createdTimestamp));

		sent.edit(`Pong! Heartbeat: ${heartbeat}ms, Round trip: ${roundTrip}ms`);
	}
};
