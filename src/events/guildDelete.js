'use strict';

module.exports = async (client, guild) => {
	if (guild.data) await guild.data.destroy();

	await client.db.models.Star.destroy({ where: { guildID: guild.id } });

	return client.db.models.Tag.destroy({ where: { guildID: guild.id } });
};
