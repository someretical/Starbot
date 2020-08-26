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

		delete() {
			const { cache, models } = this.client.db;

			return this.queue(() => this.client.sequelize.transaction(async t => {
				await models.Ignore.destroy({
					where: { guild_id: this.id },
				}, { transaction: t });
				cache.Ignore.map(ignore =>
					ignore.guild_id === this.id ? cache.Ignore.delete(ignore.user_id + this.id) : undefined,
				);

				await models.Star.destroy({
					where: { guild_id: this.id },
				}, { transaction: t });
				cache.Star.map(star => star.guild_id === this.id ? cache.Star.delete(star.message_id) : undefined);

				await models.Tag.destroy({
					where: { guild_id: this.id },
				}, { transaction: t });
				cache.Tag.map(tag => tag.guild_id === this.id ? cache.Tag.delete(tag.guild_id + tag.name) : undefined);

				await models.Guild.destroy({
					where: { id: this.id },
				}, { transaction: t });
				cache.Guild.delete(this.id);
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
