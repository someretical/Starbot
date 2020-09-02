'use strict';

const { Collection } = require('discord.js');
const Logger = require('../util/Logger.js');

class StarbotCommand {
	constructor(client, info) {
		this.client = client;
		this.path = __filename;
		this.name = info.name;
		this.description = info.description;
		this.group = info.group;
		this.usage = info.usage;
		this.args = info.args;
		this.aliases = info.aliases;
		this.guildOnly = info.guildOnly;
		this.ownerOnly = info.ownerOnly;
		this.userPermissions = info.userPermissions;
		this.clientPermissions = [];
		this.throttleDuration = info.throttle;
		this.throttles = new Collection();
	}

	reload() {
		delete require.cache[this.path];

		this.client.commands.set(this.name, require(this.path));

		Logger.info(`Reloaded ${this.name} command`);
	}

	unload() {
		if (!require.cache[this.path]) return;

		delete require.cache[this.path];

		this.client.commands.delete(this.name);

		Logger.info(`Unloaded ${this.name} command`);
	}

	async checkThrottle(message, command = '') {
		const { author, guild } = message;

		if (command) {
			const user = await this.client.db.models.User.findByPk(author.id);
			const endsAt = user.throttles.command;

			if (!endsAt) return undefined;
			if (endsAt > Date.now()) return endsAt;

			return this.client.db.models.User.q.add(author.id, user.destroy);
		}

		const throttle = this.throttles.get(guild ? author.id + guild.id : author.id);
		return throttle ? throttle.endsAt : undefined;
	}

	throttle(message) {
		const { author, guild } = message;
		if (this.client.owners.includes(author.id) || this.throttleDuration === 0) return;

		const key = guild ? author.id + guild.id : author.id;

		let throttle = this.throttles.get(key);
		if (!throttle) {
			throttle = {
				endsAt: Date.now() + this.throttleDuration,
				timeout: setTimeout(() => {
					this.throttles.delete(key);
				}, this.throttleDuration),
			};

			this.throttles.set(key, throttle);
		}
	}

	async customThrottle(message, name, duration) {
		const user = await this.client.db.models.User.findByPk(message.author.id);

		user.throttles.name = Date.now() + duration;

		return this.client.db.models.User.q.add(message.author.id, user.save);
	}
}

module.exports = StarbotCommand;
