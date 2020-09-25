'use strict';

const Discord = require('discord.js');
const { formatErrorDiscord } = require('../util/Util.js');

module.exports = Discord.Structures.extend('DMChannel', DMChannel => class StarbotDMChannel extends DMChannel {
	constructor(...args) {
		super(...args);

		this.awaiting = new Set();
	}

	ignored() {
		return this.client.db.models.OptOut.cache.has(this.recipient.id);
	}

	embed(text, fancy = false) {
		const toBeSent = this.client.embed(text, fancy);

		return this.send(toBeSent);
	}

	error(err, code) {
		return this.send(formatErrorDiscord(err, code));
	}
});
