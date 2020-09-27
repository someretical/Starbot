'use strict';

module.exports = async (client, member) => {
	if (client._ready) {
		await member.author.findCreateFind();
		member.guild.findCreateFind();
	}
};
