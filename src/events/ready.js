'use strict';

const Logger = require('../util/Logger.js');

module.exports = async client => {
	Logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);

	await client.user.add();

	client.setInterval(() => {
		client.db.cache.Star.forEach(star => {
			// 1 day
			if (Date.now() > star.updatedAt + 86400000) {
				client.db.cache.Star.delete(star.message_id);
			}
		});
		// Half hour
	}, 1800000);
};
