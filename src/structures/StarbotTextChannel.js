'use strict';

const Discord = require('discord.js');
const { formatErrorDiscord } = require('../util/util.js');

module.exports = Discord.Structures.extend('TextChannel', TextChannel => {
	class StarbotTextChannel extends TextChannel {
		constructor(...args) {
			super(...args);

			this.awaiting = new Set();
		}

		// Returns boolean
		get ignored() {
			return JSON.parse(this.guild.settings.ignoredChannels).includes(this.id);
		}

		// Returns promise
		embed(text) {
			return this.send(this.client.embed(text));
		}

		// Returns promise
		error(err, code) {
			return this.send(formatErrorDiscord(err, code));
		}

		// Returns boolean
		clientHasPermissions(perms = []) {
			const permissions = this.permissionsFor(this.guild.members.cache.get(this.client.user.id));

			if (!permissions) return false;
			if (!perms.length) perms = this.client.basePermissions;

			return permissions.has(perms);
		}
	}

	return StarbotTextChannel;
});
