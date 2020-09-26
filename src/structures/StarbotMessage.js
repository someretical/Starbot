'use strict';

const Discord = require('discord.js');
const { sanitise } = require('../util/Util.js');

module.exports = Discord.Structures.extend('Message', Message => class StarbotMessage extends Message {
	constructor(...args) {
		super(...args);

		this.prefix = undefined;
		this.raw = { command: undefined, args: undefined };
		this.command = undefined;
		this.args = [];
		this._isTag = false;
	}

	get DM() {
		return this.channel.type === 'dm';
	}

	get missingAuthorPermissions() {
		return this.command.userPermissions.filter(perm => !this.member.permissions.has(perm));
	}

	async sendTag(tag) {
		const response = tag.response
			.replace(/<guild>/ig, this.guild.name)
			.replace(/<channel>/ig, this.channel.toString())
			.replace(/<author>/ig, this.author.toString());

		await this.channel.send(response.length > 1024 ? `${response.substring(0, 1021)}...` : response);

		this.client.db.models.Tag.q.add(tag.id, () => tag.update({ uses: tag.uses + 1 }));
	}

	parse() {
		let _guild;
		if (this.guild) _guild = this.guild.model;
		const prefix = _guild ? sanitise(_guild.prefix, true) : this.client.prefix;
		const prefixPattern = new RegExp(`^(<@!?${this.client.user.id}>\\s+|${prefix})(\\S+)`);
		const matched = this.content.match(prefixPattern);

		if (matched) {
			this.prefix = matched[1];
			this.raw.command = matched[2];
		}

		if (_guild.tagsEnabled && this.raw.command) {
			const tag = this.guild.tags.find(t => t.name === this.raw.command.toLowerCase());

			if (tag) return this.sendTag(tag);
		}

		if (!this.raw.command) return this;

		let cleanedCmdName = this.raw.command.toLowerCase().trim();
		if (this.client.aliases.has(cleanedCmdName)) cleanedCmdName = this.client.aliases.get(cleanedCmdName);

		this.command = this.client.commands.find(cmd => cleanedCmdName === cmd.name);
		if (this.command) {
			this.raw.args = this.content.slice(this.prefix.length + this.raw.command.length).trim();

			const re = /(?:(?=["'])(?:"[^"\\]*(?:\\[^][^"\\]*)*"|'[^'\\]*(?:\\[^][^'\\]*)*')|\S+)(?=\s+|$)/g;
			const matches = this.raw.args.matchAll(re);

			this.args = Array.from(matches).map(arg => arg[0].replace(/^("|')([^]*)\1$/g, '$2')
				.replace(/<single_quote>/gi, '\'')
				.replace(/<double_quote>/gi, '"'));
		}

		return this;
	}
});
