'use strict';

module.exports = async member => {
	if (member.client._ready) {
		await member.author.findCreateFind();
		member.guild.findCreateFind();
	}
};
