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

		purgeData() {
			const { cache, models } = this.client.db;

			return this.queue(() => this.client.sequelize.transaction(async t => {
				await models.GlobalThrottle.destroy({
					where: { user_id: this.id },
				}, { transaction: t });
				cache.GlobalThrottle.map(throttle =>
					throttle.user_id === this.id ? cache.GlobalThrottle.delete(this.id + throttle.command) : undefined,
				);

				await models.Ignore.destroy({
					where: { user_id: this.id },
				}, { transaction: t });
				cache.Ignore.map(ignore =>
					ignore.user_id === this.id ? cache.Ignore.delete(this.id + ignore.guild_id) : undefined,
				);

				await models.Star.destroy({
					where: { author_id: this.id },
				}, { transaction: t });
				cache.Star.map(star => star.author_id === this.id ? cache.Star.delete(star.message_id) : undefined);

				await models.Tag.destroy({
					where: { creator_id: this.id },
				}, { transaction: t });
				cache.Tag.map(tag => tag.creator_id === this.id ? cache.Tag.delete(tag.guild_id + tag.name) : undefined);

				const [updatedUser] = await models.User.upsert({
					id: this.id,
					username: this.username,
					discriminator: this.discriminator,
					coins: 0,
					reputation: 0,
				});
				cache.User.set(this.id, updatedUser);
			}));
		}
	}

	return StarbotUser;
});
