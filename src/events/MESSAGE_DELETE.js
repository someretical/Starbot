'use strict';

module.exports = (client, data, guild) => {
	const star = client.db.models.Star.cache.get(data.id);
	if (star) guild.starboard.destroyStar(star);
};
