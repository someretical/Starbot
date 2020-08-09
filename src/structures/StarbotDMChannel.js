'use strict';

const Discord = require('discord.js');
const { formatErrorDiscord } = require('../util/Util.js');

module.exports = Discord.Structures.extend('DMChannel', DMChannel => {
	class StarbotDMChannel extends DMChannel {
		constructor(...args) {
			super(...args);

			this.awaiting = new Set();
		}

		// Returns boolean
		get ignored() {
			return this.client.db.cache.GlobalIgnore.has(this.recipient.id);
		}

		// Returns promise
		embed(text, fancy = false) {
			const toBeSent = this.client.embed(text, fancy);

			return this.send(toBeSent);
		}

		// Returns promise
		error(err, code) {
			return this.send(formatErrorDiscord(err, code));
		}
	}

	return StarbotDMChannel;
});
