'use strict';

const Logger = require('../util/Logger.js');

module.exports = async client => {
	Logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);

	await client.users.fetch(client.user.id);
	await client.db.models.User.q.add(client.user.id, () =>
		client.db.models.User.findCreateFind({ where: { id: client.user.id } }),
	);

	await client.db.models.OptOut.findAll();
	await client.db.models.Star.findAll();
	await client.db.models.Tag.findAll();

	client._ready = true;
};
