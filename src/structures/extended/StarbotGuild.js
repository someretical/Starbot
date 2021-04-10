'use strict';

const Discord = require('discord.js');
const Starboard = require('../Starboard.js');
const StarbotTagManager = require('../StarbotTagManager.js');

module.exports = Discord.Structures.extend(
	'Guild',
	Guild => class StarbotGuild extends Guild {
		constructor(...args) {
			super(...args);

			this.starboard = new Starboard(this);
			this.tags = new StarbotTagManager(this);
			this.locked = false;
			this.data = undefined;
		}

		async findCreateFind() {
			if (this.data) return this.data;

			const [ data ] = await this.client.db.models.Guild.findCreateFind({ where: { id: this.id } });

			this.data = data;

			return this.data;
		}

		cacheClient() {
			return this.members.fetch(this.client.user.id);
		}
	},
);
