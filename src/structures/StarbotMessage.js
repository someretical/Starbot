'use strict';

const Discord = require('discord.js');
const { sanitise } = require('../util/Util.js');

module.exports = Discord.Structures.extend('Message', Message => {
	class StarbotMessage extends Message {
		constructor(...args) {
			super(...args);

			this._guild = undefined;
			this.prefix = undefined;
			this.raw = { command: undefined, args: undefined };
			this.command = undefined;
			this.args = [];
			this.tag = false;
		}

		get DM() {
			return this.channel.type === 'dm';
		}

		get missingAuthorPermissions() {
			const missingPerms = [];

			for (const permission of this.command.userPermissions) {
				if (!this.member.permissions.has(permission)) missingPerms.push(permission);
			}

			return missingPerms;
		}

		async sendTag(tag) {
			const response = tag.response.replace(/<guild_name>/ig, this.guild.name)
				.replace(/<channel>/ig, this.channel.toString())
				.replace(/<author>/ig, this.author.toString());

			await this.channel.send(response);

			tag.uses++;
			this.client.db.models.Tag.q.add(tag.id, tag.save);
		}

		async parse() {
			this._guild = await this.guild.findOrCreate();
			const prefix = this.guild && this._guild.prefix ? sanitise(this._guild.prefix, true) : this.client.prefix;
			const prefixPattern = new RegExp(`^(<@!?${this.client.user.id}>\\s+|${prefix})(\\S+)`);

			const matched = this.content.match(prefixPattern);
			if (matched) {
				this.prefix = matched[1];
				this.raw.command = matched[2];
			}

			if (this.guild && this._guild.tagsEnabled) {
				const tag = await this.client.db.models.Tag.findOne({
					where: { guild_id: this.guild.id, name: this.raw.command.toLowerCase() },
				});

				if (tag) {
					await this.sendTag(tag);
					this.tag = true;

					return;
				}
			}

			let cleanedCmdName = this.raw.command.toLowerCase().trim();
			if (this.client.aliases.has(cleanedCmdName)) {
				cleanedCmdName = this.client.aliases.get(cleanedCmdName);
			}

			this.command = this.client.commands.find(cmd => cleanedCmdName === cmd.name);
			if (this.command) {
				this.raw.args = this.content.slice(this.prefix.length + this.raw.command.length).trim();

				const re = /(?:(?=["'])(?:"[^"\\]*(?:\\[^][^"\\]*)*"|'[^'\\]*(?:\\[^][^'\\]*)*')|\S+)(?=\s+|$)/g;
				const matches = this.raw.args.matchAll(re);

				this.args = Array.from(matches).map(arg => arg[0].replace(/^("|')([^]*)\1$/g, '$2')
					.replace(/<single_quote>/gi, '\'')
					.replace(/<double_quote>/gi, '"'));
			}
		}
	}

	return StarbotMessage;
});
