'use strict';

const Discord = require('discord.js');
const { sanitise } = require('../util/util.js');

module.exports = Discord.Structures.extend('Message', Message => {
	class StarbotMessage extends Message {
		constructor(...args) {
			super(...args);

			this.prefix = null;
			this.raw = { command: '', args: '' };
			this.command = null;
			this.args = [];
			this.tag = null;
		}

		// Returns boolean
		// Applies to ignoring commands while a message collector is active
		// Applies to blacklist
		// Applies to ignored channels
		get ignored() {
			return this.channel.awaiting.has(this.author.id) || this.author.ignored ||
				(this.guild && this.channel.ignored) ||
				(this.guild && this.guild.ignores.has(this.author.id + this.guild.id));
		}

		// Returns boolean
		get DM() {
			return this.channel.type === 'dm';
		}

		// Returns empty array if all permission requirements are met
		get missingAuthorPermissions() {
			const missingPerms = [];

			for (const permission of this.command.userPermissions) {
				if (!this.member.permissions.has(permission)) missingPerms.push(permission);
			}

			return missingPerms;
		}

		// Returns null or error
		async sendTag() {
			if (!this.guild.settings.tagsEnabled) return null;

			await this.channel.send(this.tag.response);

			const upsertObj = this.tag.toJSON();
			upsertObj.uses++;

			const [updatedTag] = await this.guild.queue(() => this.client.db.models.Tag.upsert(upsertObj));

			this.client.db.cache.Tag.set(this.guild.id + this.tag.name, updatedTag);
			return null;
		}

		// Returns parsed StarbotMessage
		parse() {
			let prefixPattern = null;

			if (this.guild) {
				const guildPrefix = sanitise(this.guild.settings.prefix);

				prefixPattern = new RegExp(
					`^(<@!?${this.client.user.id}>\\s+(?:${guildPrefix}\\s*)?|${guildPrefix}\\s*)([^\\s]+)`, 'i');
			} else {
				prefixPattern = new RegExp(`^(<@!?${this.client.user.id}>\\s+|${this.client.prefix})([^\\s]+)`, 'i');
			}

			if (prefixPattern.test(this.content)) {
				const matched = this.content.match(prefixPattern);

				this.prefix = matched[1];
				this.raw.command = matched[2];
			}

			if (this.guild) this.tag = this.guild.tags.get(this.guild.id + this.raw.command.toLowerCase());

			let cleanedCmdName = this.raw.command.toLowerCase().trim();

			if (this.client.aliases.has(cleanedCmdName)) {
				cleanedCmdName = this.client.aliases.get(cleanedCmdName);
			}

			this.command = this.client.commands.find(cmd => cleanedCmdName === cmd.name);

			if (this.command) {
				this.raw.args = this.content.slice(this.prefix.length + this.raw.command.length).trim();

				const argPattern = /\s*(?:("|')([^]*?)\1|(\S+))\s*/g;
				let length = this.raw.args.length;
				let match = [];

				while (--length && (match = argPattern.exec(this.raw.args))) {
					this.args.push(match[2] || match[3]);
				}

				if (match && argPattern.lastIndex < this.raw.args.length) {
					this.args.push(this.raw.args.substr(argPattern.lastIndex).replace(/^("|')([^]*)\1$/g, '$2'));
				}
			}

			return this;
		}
	}

	return StarbotMessage;
});
