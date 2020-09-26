'use strict';

const { stripIndents, oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

const embed = (client, prefix) => client.embed(null, true)
	.setTitle('What user data the bot collects')
	.setDescription(stripIndents`
		${oneLine`
			• User IDs - these [snowflakes](https://github.com/twitter-archive/snowflake)
			uniquely identify users and can be used to obtain user information 
			if the bot is in any server that the user is also in.
			They are also publicly accessible to anyone who can access your profile.
		`}
		• Tag names + responses - the bot stores the names and responses of your tags on applicable servers.
		${oneLine`
			• Starred messages - the bot stores the message ID and
			reactors of your starred messages on applicable servers.
		`}
		• Blocking - the bot only stores the IDs of blocked users
		• Throttling - the bot stores user IDs to enable the throttling of commands with long cooldowns.

		${oneLine`
			If you wish to delete all your data stored by the bot, you can run the
			\`${prefix}purgedata\` command.
		`}

		${oneLine`
			If you wish to completely opt out of participating with the bot,
			you can run the \`${prefix}opt-out\` command. This command is **NOT REVERSIBLE**.
		`}
	`)
	.addField('Extra notes', stripIndents`
		• If you opt out, your user ID will still be stored in the reactors of starred messages by other users.
		${oneLine`
			• The \`${prefix}purgedata\` command will delete everything about you with the
			exception of the above and will reset your user coins and reputation to 0.
		`}
		${oneLine`
			• The \`${prefix}opt-out\` command will delete everything about you with the 
			exception of the above and will reset your user coins and reputation to 0.
		`}
		${oneLine`
			• It will also create an entry with your ID in it so the bot knows to block you in the future.
		`}
		${oneLine`
			• If a user is not in the same server as you, they will not be able to see guild specific data
			about you such as stars and tags.
		`}
		${oneLine`
			• Every measure has been taken to prevent the erosion of privacy
			from occurring to your data once you opt out.
		`}
		${oneLine`
			• All the data described above is what the bot will save to secondary storage. 
			Other data may be used but not saved while the bot is running.
		`}
	`);

module.exports = class DataCollection extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'datacollection',
			description: 'view what types of data about you the bot will collect',
			group: 'info',
			usage: '',
			args: [],
			aliases: ['datacollected'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, author, channel, guild } = message;

		try {
			await author.send(embed(client, guild.model.prefix));
			channel.send('Please check your DM\'s with the bot.');
		} catch (err) {
			channel.send('Please enable direct messages to view the data collection policy.');
		}
	}
};
