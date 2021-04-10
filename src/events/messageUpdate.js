'use strict';

module.exports = async (client, m1, m2) => {
	if (
		!client._ready
		|| m1.content === m2.content
		|| m2.system
		|| m2.webhookID
	) return;

	if (m2.guild && !m2.guild.available) return;

	if (m2.guild) {
		await m2.guild.findCreateFind();
		await m2.guild.cacheClient();
	}

	const hooks = [ client.hooks.get('checkBlockedChannels'), client.hooks.get('checkBlockedUsers') ];

	for (const hook of hooks) {
		// eslint-disable-next-line no-await-in-loop
		const status = await hook.call(
			client,
			m2,
		);
		if (status === true || typeof status === 'string') return;
	}

	m2.guild.starboard.fixStar(m2);
};
