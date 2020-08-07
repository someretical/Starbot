'use strict';

module.exports = async member => {
	if (!member.client.ready) return;

	await member.author.add();

	if (member.guild.available) member.guild.add();
};
