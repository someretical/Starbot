'use strict';

const Discord = require('discord.js');

module.exports = Discord.Structures.extend(
	'DMChannel',
	DMChannel => class StarbotDMChannel extends DMChannel {
		constructor(...args) {
			super(...args);

			this.awaiting = new Set();
		}

		embed(str) {
			return this.send(this.client.embed(str));
		}
	},
);
