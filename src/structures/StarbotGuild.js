'use strict';

const Discord = require('discord.js');
const Starboard = require('./Starboard.js');
const StarbotQueue = require('./StarbotQueue.js');

module.exports = Discord.Structures.extend('Guild', Guild => {
	class StarbotGuild extends Guild {
		constructor(...args) {
			super(...args);

			this.starboard = new Starboard(this);
			this._queue = new StarbotQueue();
		}

		get settings() {
			return this.client.db.cache.Guild.get(this.id);
		}

		get ignores() {
			return this.client.db.cache.Ignore.filter(ignore => ignore.guild_id === this.id);
		}

		get tags() {
			return this.client.db.cache.Tag.filter(tag => tag.guild_id === this.id);
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
			if (this.client.db.cache.Guild.has(this.id)) return;

			const [guild] = await this.queue(() => this.client.db.models.Guild.upsert({
				id: this.id,
			}));

			this.client.db.cache.Guild.set(this.id, guild);
		}

		// Returns promise
		delete() {
			return this.queue(() => this.client.sequelize.transaction(async t => {
				await this.client.db.models.Ignore.destroy({
					where: { guild_id: this.id },
				}, {
					transaction: t,
				});
				this.client.db.cache.Ignore.forEach(ignore => {
					if (ignore.guild_id === this.id) this.client.db.cache.Ignore.delete(ignore.user_id + this.id);
				});

				await this.client.db.models.Star.destroy({
					where: { guild_id: this.id },
				}, {
					transaction: t,
				});
				this.client.db.cache.Star.forEach(star => {
					if (star.guild_id === this.id) this.client.db.cache.Star.delete(star.message_id);
				});

				await this.client.db.models.Tag.destroy({
					where: { guild_id: this.id },
				}, {
					transaction: t,
				});
				this.client.db.cache.Tag.forEach(tag => {
					if (tag.guild_id === this.id) this.client.db.cache.Tag.delete(tag.guild_id + tag.name);
				});

				await this.client.db.models.Guild.destroy({
					where: { id: this.id },
				}, {
					transaction: t,
				});
				this.client.db.cache.Guild.delete(this.id);
			}));
		}

		async cacheClient() {
			await this.client.users.fetch(this.client.user.id);

			await this.members.fetch(this.client.user.id);
		}

		checkClientPermissions(perms = []) {
			if (!perms.length) perms = this.client.basePermissions;

			return this.guild.members.cache.get(this.client.user.id).permissions.has(perms);
		}
	}

	return StarbotGuild;
});
