'use strict';

module.exports = guild => {
	if (!guild.client.ready) return;

	if (guild.available) guild.add();
};
