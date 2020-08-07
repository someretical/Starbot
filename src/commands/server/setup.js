'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class Setup extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'setup',
			description: 'setup the bot to run on a server',
			group: 'server',
			usage: '',
			args: [],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel, guild } = message;

		const prefix = guild.settings.prefix;

		channel.embed(client.embed(stripIndents`
			• This guide details how to customise ${client.user.username} on your server.
			• Run \`${prefix}help\` for a list of all commands.
			• For more help on a command, run \`${prefix}help <command>\`.
			• For more information about command arguments, run \`${prefix}help arguments\`
			• Below are some basic customisation commands to get you started:
		`)
			.setTitle(`Setup guide for ${guild.name}`)
			.setThumbnail(client.user.displayAvatarURL())
			.addField('Change prefix', `\`${prefix}setprefix <prefix>\``, true)
			.addField('Set starboard channel', `\`${prefix}setstarboard <channel>\``, true)
			.addField('Add tags', `\`${prefix}addtag\``, true)
			.addField('Set starboard reaction threshold', `\`${prefix}setreactionthreshold <number>\``)
			.addField('Ignore channels', `\`${prefix}ignorechannel <channel>\``), true);
	}
}

module.exports = Setup;
