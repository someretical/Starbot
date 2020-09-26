'use strict';

const { homepage } = require('../../../package.json');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class DataCollection extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'datacollection',
			description: 'view what types of data about you the bot will collect',
			group: 'info',
			usage: '',
			args: [],
			aliases: ['datacollected'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel } = message;

		channel.send(client.embed(`View the data collection policy [here](${homepage}#data-collection-policy).`));
	}
};
