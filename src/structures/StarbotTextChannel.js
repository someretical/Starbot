'use strict';

const Discord = require('discord.js');
const { formatErrorDiscord } = require('../util/Util.js');

module.exports = Discord.Structures.extend('TextChannel', TextChannel => {
	class StarbotTextChannel extends TextChannel {
		constructor(...args) {
			super(...args);

			this.awaiting = new Set();
		}

		async ignored() {
			const Guild = await this.client.db.models.Guild.findByPk(this.guild.id);

			return Guild.ignoredChannels.includes(this.id);
		}

		embed(text) {
			return this.send(this.client.embed(text));
		}

		error(err, code) {
			return this.send(formatErrorDiscord(err, code));
		}

		clientHasPermissions(perms = []) {
			const permissions = this.permissionsFor(this.guild.members.cache.get(this.client.user.id));

			if (!permissions) return false;
			if (!perms.length) perms = this.client.basePermissions;

			return permissions.has(perms);
		}
	}

	return StarbotTextChannel;
});
