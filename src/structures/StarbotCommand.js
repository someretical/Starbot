'use strict';

const path = require('path');
const { Collection } = require('discord.js');
const moment = require('moment');
const Logger = require('../util/Logger.js');
const StarbotQueue = require('./StarbotQueue.js');

class StarbotCommand {
	constructor(client, info) {
		this.client = client;
		this.path = path.resolve(`./src/commands/${this.group}/${this.name}.js`);
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
	}

	reload() {
		try {
			delete require.cache[this.path];

			this.client.commands.set(this.name, require(this.path));

			return Logger.info(`Reloaded ${this.name} command`);
		} catch (err) {
			return err;
		}
	}

	unload() {
		if (!require.cache[this.path]) return;

		delete require.cache[this.path];

		this.client.commands.delete(this.name);

		Logger.info(`Unloaded ${this.name} command`);
	}

	queue(key, promiseFunction) {
		let queue = this.queues.get(key);

		if (!queue) {
			this.queues.set(key, new StarbotQueue());

			queue = this.queues.get(key);
		}

		return new Promise((resolve, reject) => {
			queue.add(() => promiseFunction().then(value => {
				if (!queue.length) this.queues.delete(key);

				resolve(value);
			}).catch(err => {
				reject(err);

				throw err;
			}));
		});
	}

	checkThrottle(message, command = '') {
		const { client, author, guild } = message;

		if (guild && command) {
			const throttle = client.db.cache.GlobalThrottle.get(author.id + command);
			if (throttle) {
				const now = Date.now();
				const endsAt = moment(throttle.endsAt).valueOf();

				if (endsAt > now) {
					return endsAt;
				} else {
					this.queue(author.id + command, () => throttle.destroy());
				}
			}
		}

		const throttle = this.throttles.get(guild ? author.id + guild.id + this.name : author.id + this.name);
		if (throttle) return throttle.endsAt;

		return undefined;
	}

	async globalThrottle(message, command, duration) {
		const { client, author } = message;
		const now = Date.now();
		const [record] = await this.queue(author.id + command, () => client.db.models.GlobalThrottle.upsert({
			user_id: author.id,
			command: command,
			endsAt: now + duration,
		}));

		client.db.cache.GlobalThrottle.set(author.id + command, record);
	}

	throttle(message) {
		const { client, author, guild } = message;
		if (client.owners.includes(author.id) || this.throttleDuration === 0) return;

		const key = guild ? author.id + guild.id + this.name : author.id + this.name;

		let throttle = this.throttles.get(key);
		if (!throttle) {
			throttle = {
				endsAt: Date.now() + this.throttleDuration,
				timeout: client.setTimeout(() => {
					this.throttles.delete(key);
				}, this.throttleDuration),
			};

			this.throttles.set(key, throttle);
		}
	}
}

module.exports = StarbotCommand;
