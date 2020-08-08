'use strict';

const path = require('path');
const { Collection } = require('discord.js');
const moment = require('moment');
const logger = require('../util/logger.js');
const StarbotQueue = require('./StarbotQueue.js');

class StarbotCommand {
	constructor(client, info) {
		this.client = client;
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
		this.queues = new Collection();
		this.throttles = new Collection();

		Object.defineProperty(this, 'path', { value: path.resolve(`./src/commands/${this.group}/${this.name}.js`) });
	}

	// Returns null or error
	reload() {
		try {
			delete require.cache[this.path];

			this.client.commands.set(this.name, require(this.path));

			return logger.info(`Reloaded ${this.name} command`);
		} catch (err) {
			return err;
		}
	}

	// Returns null or error
	unload() {
		try {
			if (require.cache[this.path]) {
				delete require.cache[this.path];

				this.client.commands.delete(this.name);

				return logger.info(`Unloaded ${this.name} command`);
			} else {
				throw new Error(`Unable to unload command ${this.name}`);
			}
		} catch (err) {
			return err;
		}
	}

	// Returns promise
	queue(key, promiseFunction) {
		let queue = this.queues.get(key);

		if (!queue) {
			this.queues.set(key, new StarbotQueue());

			queue = this.queues.get(key);
		}

		return new Promise((resolve, reject) => {
			queue.add(() => promiseFunction().then(value => {
				if (!queue.length) {
					this.queues.delete(key);
				}

				resolve(value);
			}).catch(err => {
				reject(err);

				throw err;
			}));
		});
	}

	// Returns number of milliseconds or null
	checkThrottle(message, command = '') {
		const { cache } = message.client.db;
		const { author } = message;
		const guild = message.guild;

		if (guild && command) {
			const throttle = cache.GlobalThrottle.get(author.id + command);

			if (throttle) {
				const now = Date.now();
				const endsAt = moment(throttle.endsAt).valueOf();

				if (endsAt > now) {
					return endsAt;
				} else {
					this.queue(author.id + command, () => throttle.destroy());
				}
			}

			return null;
		}

		const throttle = this.throttles.get(guild ? author.id + guild.id + this.name : author.id + this.name);

		if (throttle) return throttle.endsAt;

		return null;
	}

	// Returns null or error
	async globalThrottle(message, command, duration) {
		const { cache, models } = message.client.db;
		const now = Date.now();

		try {
			const [record] = await this.queue(message.author.id + command, () => models.GlobalThrottle.upsert({
				user_id: message.author.id,
				command: command,
				endsAt: now + duration,
			}));

			cache.GlobalThrottle.set(message.author.id + command, record);
		} catch (err) {
			return err;
		}
		return null;
	}

	// Returns null
	throttle(message) {
		if (this.client.owners.includes(message.author.id) || this.throttleDuration === 0) return;

		const key = message.guild ? message.author.id + message.guild.id + this.name :
			message.author.id + this.name;

		let throttle = this.throttles.get(key);

		if (!throttle) {
			throttle = {
				endsAt: Date.now() + this.throttleDuration,
				timeout: this.client.setTimeout(() => {
					this.throttles.delete(key);
				}, this.throttleDuration),
			};

			this.throttles.set(key, throttle);
		}
	}
}

module.exports = StarbotCommand;
