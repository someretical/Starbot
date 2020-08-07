'use strict';

const Starbot = require('./src/structures/Starbot.js');
/* eslint-disable no-unused-vars */
const StarbotDMChannel = require('./src/structures/StarbotDMChannel.js');
const StarbotGuild = require('./src/structures/StarbotGuild.js');
const StarbotMessage = require('./src/structures/StarbotMessage.js');
const StarbotTextChannel = require('./src/structures/StarbotTextChannel.js');
const StarbotUser = require('./src/structures/StarbotUser.js');
/* eslint-enable no-unused-vars */

const client = new Starbot({
	shardCount: 1,
	messageCacheMaxSize: 200,
	fetchAllMembers: false,
	disableEveryone: false,
	partials: [],
	disabledEvents: [],
	retryLimit: 1,
	presence: {
		status: 'online',
		afk: false,
		activity: {
			name: 'myself being tweaked',
			type: 'WATCHING',
		},
	},
});

client.run();
