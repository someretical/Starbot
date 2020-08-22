'use strict';

const Discord = require('discord.js');
const StarbotQueue = require('./StarbotQueue.js');

module.exports = Discord.Structures.extend('User', User => {
	class StarbotUser extends User {
		constructor(...args) {
			super(...args);

			this._queue = new StarbotQueue();
		}

		get data() {
			return this.client.db.cache.User.get(this.id);
		}

		get ignored() {
			return this.client.db.cache.GlobalIgnore.has(this.id);
		}

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

		async add() {
			const user = this.client.db.cache.User.get(this.id);
			if (user) {
				if (user.username === this.username && user.discriminator === this.discriminator) return;
			}

			const [upserted] = await this.queue(() => this.client.db.models.User.upsert({
				id: this.id,
				username: this.username,
				discriminator: this.discriminator,
			}));

			this.client.db.cache.User.set(this.id, upserted);
		}
	}

	return StarbotUser;
});
