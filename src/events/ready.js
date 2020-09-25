'use strict';

const Logger = require('../util/Logger.js');

module.exports = async client => {
	Logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);

	await client.user.setPresence({
		status: 'online',
		afk: false,
		activity: {
			name: `@${client.user.username} help`,
			type: 'PLAYING',
		},
	});
	await client.users.fetch(client.user.id);
	await client.db.models.User.q.add(client.user.id, () =>
		client.db.models.User.findCreateFind({ where: { id: client.user.id } }),
	);

	// eslint-disable-next-line no-await-in-loop
	for (const model in client.db.models) await client.db.models[model].findAll();

	client._ready = true;
	Logger.info('Cached models');
	Logger.info(`Client ready at ${new Date()}`);
};
