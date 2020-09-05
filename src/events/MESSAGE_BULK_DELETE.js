'use strict';

module.exports = (client, data, guild) => {
	data.ids.map(id => {
		const star = client.db.models.Star.cache.get(id);
		if (star) guild.starboard.destroyStar(star);
		return undefined;
	});
};
