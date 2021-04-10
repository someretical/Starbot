'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class Ping extends StarbotCommand {
	constructor(client) {
		super(
			client,
			{
				__dirname,
				name:        'ping',
				aliases:     [ 'pong' ],
				description: 'check the bot\'s connection',
				usage:       [],
				guildOnly:   false,
				throttle:    {
					duration:   5000,
					persistent: false,
				},
			},
		);
	}

	async run(message) {
		const { client, channel, createdTimestamp, editedTimestamp } = message;

		const sent = await channel.embed('Pinging...');
		const heartbeat = Math.floor(client.ws.ping);
		const roundTrip = Math.floor(sent.createdTimestamp - (editedTimestamp || createdTimestamp));

		sent.edit(client.embed(`Pong! Heartbeat: ${heartbeat}ms, Round trip: ${roundTrip}ms`));
	}
};
