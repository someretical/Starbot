'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class DummyCommand extends StarbotCommand {
	constructor(client) {
		super(
			client,
			{
				__dirname,
				name:        '',
				aliases:     [],
				description: '',
				usage:       [],
				guildOnly:   false,
				ownerOnly:   true,
				throttle:    {
					duration:   5000,
					persistent: false,
				},
				permissions: {
					client: [],
					user:   [],
				},
				hooks: {
					before: [],
					after:  [],
				},
			},
		);
	}

	run(message) {
		return message;
	}
};
