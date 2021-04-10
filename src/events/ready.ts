import { PRESENCE } from '../util/Constants.js';
import Logger from '../util/Logger.js';
import Util from '../util/Util.js';

export default async client => {
	Logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);

	await client.users.fetch(client.user.id);

	PRESENCE.activity.name = `@${client.user.username} ${PRESENCE.activity.name}`;
	await client.user.setPresence(PRESENCE);

	const { owner } = await client.fetchApplication();
	client.ownerID = owner.id;

	const guildRows = [];
	const cachePromises = [];
	let counter = 0;

	client.guilds.cache.forEach(guild => {
		guildRows.push(
			client.db.models.Guild.findCreateFind({ where: { id: guild.id } })
		);

		cachePromises.push(guild.cacheClient());

		counter++;
	});

	await Promise.all(guildRows);
	await Promise.all(cachePromises);

	for (const guild of guildRows) client.guilds.cache[guild.id] = guild;

	Logger.info(`Cached ${counter} guild${Util.pluralise(counter)}`);

	client._ready = true;
	client._hrtime = process.hrtime(client._hrtime);
	Logger.info(
		`Client ready in ${client._hrtime[0] > 0 ? `${client._hrtime[0]}s ` : ''}${
			client._hrtime[1] / 1000000
		}ms`
	);
};
