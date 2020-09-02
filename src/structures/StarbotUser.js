'use strict';

const Discord = require('discord.js');
const StarbotQueue = require('./StarbotQueue.js');

module.exports = Discord.Structures.extend('User', User => {
	class StarbotUser extends User {
		constructor(...args) {
			super(...args);

			this._queue = new StarbotQueue();
		}

		async ignored() {
			const OptOut = await this.client.db.models.OptOut.findByPk(this.id);

			return Boolean(OptOut);
		}

		async findOrCreate() {
			const [_User] = await this.client.db.models.Guild.findOrCreate({ where: { id: this.id } });

			return _User;
		}

		purgeData() {
			return this.client.db.models.User.q.add(() => this.client.db.transaction(async t => {
				await this.client.db.models.Star.destroy({
					where: { author_id: this.id },
				}, { transaction: t });

				await this.client.db.models.Tag.destroy({
					where: { creator_id: this.id },
				}, { transaction: t });

				this.client.db.models.User.upsert({
					id: this.id,
					coins: 0,
					reputation: 0,
					throttles: {},
				});
			}));
		}
	}

	return StarbotUser;
});
