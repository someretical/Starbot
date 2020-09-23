'use strict';

const { oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchChannels } = require('../../util/Util.js');

module.exports = class Starboard extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'starboard',
			description: `change starboard settings, use \`${client.prefix}viewsettings\` to see settings`,
			group: 'starboard',
			usage: '<setting> <value>',
			args: [{
				name: '<setting>',
				optional: false,
				description: 'one of the following: enabled, threshold, channel',
				example: 'enabled',
				code: true,
			}, {
				name: 'enabled <value>',
				optional: false,
				description: 'yes/no',
				example: 'yes',
				code: true,
			}, {
				name: 'threshold <value>',
				optional: false,
				description: 'an integer larger than 0',
				example: '2',
				code: true,
			}, {
				name: 'channel <value>',
				optional: false,
				description: 'a channel mention or ID',
				example: `<#${client.snowflake()}>`,
				code: false,
			}],
			aliases: ['sb'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;

		if (!args[0]) {
			return channel.send('Please provide a setting to change!');
		}


		const setting = (args[0].match(/^(enabled|threshold|channel)$/i) || [])[1];
		if (!setting) {
			return channel.send('Please provide a valid setting!');
		}

		if (!args[1]) {
			return channel.send('Please provide a new value for the setting!');
		}

		if (setting === 'enabled') {
			let boolean = (args[1].match(/^(y(?:es)?|no?)$/i) || [])[1];
			if (!boolean) {
				return channel.send('Please provide a valid boolean resolvable!');
			}

			const _guild = await guild.findCreateFind();
			boolean = boolean.startsWith('y');

			if (_guild.starboardEnabled !== boolean) {
				await client.db.models.Guild.q.add(guild.id, () => _guild.update({ starboardEnabled: boolean }));
			}

			return channel.send(oneLine`
				The starboard for this server has been ${boolean ? 'enabled' : 'disabled'}.
				Make sure to also set the starboard channel so the bot posts starred messages.
			`);
		} else if (setting === 'threshold') {
			const threshold = parseInt(args[1]);

			if (Number.isNaN(threshold) || !Number.isSafeInteger(threshold) || threshold < 1) {
				return channel.send('Please provide a valid integer!');
			}

			const _guild = await guild.findCreateFind();

			if (_guild.reactionThreshold !== threshold) {
				await client.db.models.Guild.q.add(guild.id, () => _guild.update({ reactionThreshold: threshold }));
			}

			return channel.send(`The reaction threshold for this server has been set to ${threshold} ⭐.`);
		} else {
			const starboard = guild.channels.cache.get(matchChannels(args[1])[0]);
			if (!starboard) {
				return channel.send('Sorry but the bot couldn\'t find that channel.');
			}

			if (starboard.type !== 'text') {
				return channel.send('Please provide a **text** channel!');
			}

			const _guild = await guild.findCreateFind();

			if (_guild.starboard_id !== starboard.id) {
				await client.db.models.Guild.q.add(guild.id, () => _guild.update({ starboard_id: starboard.id }));
			}

			return channel.send(`The channel ${starboard.toString()} has been set as the starboard.`);
		}
	}
};
