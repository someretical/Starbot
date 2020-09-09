'use strict';

const Discord = require('discord.js');

module.exports = Discord.Structures.extend('User', User => class StarbotUser extends User {
	get ignored() {
		return this.client.db.models.OptOut.cache.has(this.id);
	}

	async findCreateFind() {
		const cached = this.client.db.models.User.cache.get(this.id);
		if (cached) return cached;

		const [_user] = await this.client.db.models.User.q.add(this.id, () =>
			this.client.db.models.User.findCreateFind({ where: { id: this.id } }),
		);

		return _user;
	}

	purgeData() {
		return this.client.db.transaction(async t => {
			await this.client.db.models.Star.destroy({
				where: { author_id: this.id },
			}, { transaction: t });

			await this.client.db.models.Tag.destroy({
				where: { creator_id: this.id },
			}, { transaction: t });

			const _user = await this.findCreateFind();
			this.client.db.models.User.q.add(this.id, () => _user.update({
				id: this.id,
				coins: 0,
				reputation: 0,
				throttles: {},
			}, { transaction: t }));
		});
	}
});
