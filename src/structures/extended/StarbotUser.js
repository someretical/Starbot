'use strict';

const Discord = require('discord.js');

module.exports = Discord.Structures.extend(
	'User',
	User => class StarbotUser extends User {
		constructor(...args) {
			super(...args);

			this.data = undefined;
		}

		async findCreateFind() {
			if (this.data) return this.data;

			const [ data ] = await this.client.db.models.User.findCreateFind({ where: { id: this.id } });

			this.data = data;

			return this.data;
		}
	},
);
