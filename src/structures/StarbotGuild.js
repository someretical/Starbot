'use strict';

const Discord = require('discord.js');
const Starboard = require('./Starboard.js');

module.exports = Discord.Structures.extend('Guild', Guild => {
	class StarbotGuild extends Guild {
		constructor(...args) {
			super(...args);

			this.starboard = new Starboard(this);
		}

		async findOrCreate() {
			const [_guild] = await this.client.db.models.Guild.findOrCreate({ where: { id: this.id } });

			return _guild;
		}

		delete() {
			return this.client.db.models.Guild.q.add(() => this.client.db.transaction(async t => {
				await this.client.db.models.Star.destroy({
					where: { guild_id: this.id },
				}, { transaction: t });

				await this.client.db.models.Tag.destroy({
					where: { guild_id: this.id },
				}, { transaction: t });

				await this.client.db.models.Guild.destroy({
					where: { id: this.id },
				}, { transaction: t });
			}));
		}

		cacheClient() {
			return this.members.fetch(this.client.user.id);
		}

		checkClientPermissions(perms = []) {
			if (!perms.length) perms = this.client.basePermissions;

			return this.guild.members.cache.get(this.client.user.id).permissions.has(perms);
		}
	}

	return StarbotGuild;
});
