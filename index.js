'use strict';

require('./src/structures/StarbotDMChannel.js');
require('./src/structures/StarbotGuild.js');
require('./src/structures/StarbotMessage.js');
require('./src/structures/StarbotTextChannel.js');
require('./src/structures/StarbotUser.js');

const Starbot = require('./src/structures/Starbot.js');
const client = new Starbot({
	shardCount: 1,
	messageCacheMaxSize: 200,
	fetchAllMembers: false,
	disableEveryone: false,
	partials: [],
	disabledEvents: [],
	retryLimit: 0,
	presence: {
		status: 'online',
		afk: false,
		activity: {
			name: '@Starbot help',
			type: 'PLAYING',
		},
	},
});

client.run();
