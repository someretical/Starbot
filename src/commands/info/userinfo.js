'use strict';

const moment = require('moment');
const { capitaliseFirstLetter: cfl, pluralize, matchUsers } = require('../../util/Util.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class UserInfo extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'userinfo',
			description: 'get information about a user',
			group: 'info',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'a user mention or ID',
				example: client.owners[0],
			}],
			aliases: ['user'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, author, channel, guild, args } = message;
		const invalid = () => channel.embed('Please provide a valid user resolvable!');
		let user = null, member = null;

		if (!args[0]) return invalid();

		try {
			user = await client.users.fetch(!args[0] ? author.id : matchUsers(args[0])[0]);

			if (guild) {
				member = await guild.members.fetch(user.id);
			}
		} catch (err) {
			return invalid();
		}

		if (!user) return invalid();

		await user.add();
		const data = user.data;

		const embed = client.embed()
			.setAuthor(user.tag, user.avatarURL(), `https://discord.com/channels/@me/${user.id}`)
			.setThumbnail(user.avatarURL())
			.setTimestamp()
			.setTitle(`${user.tag} information`)
			.addField('Username', user.username, true)
			.addField('Discriminator', user.discriminator, true)
			.addField('ID', user.id, true)
			.addField('Created at', moment(user.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true)
			.addField('Presence', cfl(user.presence.status), true);

		if (guild) {
			const boostDate = member.premiumSince ?
				moment(member.premiumSince).format('dddd, MMMM Do YYYY, h:mm:ss a') :
				'None';

			embed.addField('Joined at', moment(member.joinedAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true)
				.addField('Nickname', member.nickname || 'None', true)
				.addField('Roles', `${member.roles.cache.size} role${pluralize(member.roles.cache.size)}`, true)
				.addField('Display colour', member.displayHexColor, true)
				.addField('Last boost date', boostDate, true);
		}

		embed.addField('Coins', `${data.coins} coin${pluralize(data.coins)}`, true)
			.addField('Reputation', `${data.reputation} reputation`, true);

		return channel.send(embed);
	}
}

module.exports = UserInfo;
