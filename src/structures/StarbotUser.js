'use strict';

const Discord = require('discord.js');
const StarbotQueue = require('./StarbotQueue.js');

module.exports = Discord.Structures.extend('User', User => {
	class StarbotUser extends User {
		constructor(...args) {
			super(...args);

			this._queue = new StarbotQueue();
		}

		// Returns instance of User model
		get data() {
			return this.client.db.cache.User.get(this.id);
		}

		// Returns boolean
		get ignored() {
			return this.client.db.cache.GlobalIgnore.has(this.id);
		}

		// Returns promise
		queue(promiseFunction) {
			return new Promise((resolve, reject) => {
				this._queue.add(() => promiseFunction().then(value => {
					resolve(value);
				}).catch(err => {
					reject(err);

					throw err;
				}));
			});
		}

		// Returns null or error
		async add() {
			if (this.client.db.cache.User.has(this.id)) return null;

			const [user] = await this.queue(() => this.client.db.models.User.upsert({
				id: this.id,
				username: this.username,
				discriminator: this.discriminator,
			}));

			this.client.db.cache.User.set(this.id, user);
			return null;
		}
	}

	return StarbotUser;
});
