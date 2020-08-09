'use strict';

const moment = require('moment');
const { capitaliseFirstLetter: cfl, pluralize } = require('../../util/Util.js');
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
			aliases: ['infouser'],
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
		const id = args[0] ? (args[0].match(/^(?:<@!?)?(\d+)>?$/) || [])[1] : author.id;

		if (!id) return invalid();

		let infoUser = null;
		try {
			infoUser = await client.users.fetch(id);
		} catch (err) {
			return invalid();
		}
		if (!infoUser) return invalid();

		await infoUser.add();
		const data = infoUser.data;

		const embed = client.embed()
			.setAuthor(infoUser.tag, infoUser.avatarURL(), `https://discord.com/channels/@me/${infoUser.id}`)
			.setThumbnail(infoUser.avatarURL())
			.setTimestamp()
			.setTitle(`${infoUser.tag} information`)
			.addField('Username', infoUser.username, true)
			.addField('Discriminator', infoUser.discriminator, true)
			.addField('ID', infoUser.id, true)
			.addField('Created at', moment(infoUser.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true)
			.addField('Presence', cfl(infoUser.presence.status), true);

		if (guild) {
			const member = await guild.members.fetch(infoUser.id);

			const boostDate = infoUser.premiumSince ?
				moment(infoUser.premiumSince).format('dddd, MMMM Do YYYY, h:mm:ss a') :
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
