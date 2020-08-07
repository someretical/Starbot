'use strict';

module.exports = guild => {
	if (!guild.client.ready) return;

	guild.delete();
};
