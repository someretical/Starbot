'use strict';

const moment = require('moment');
const { capitaliseFirstLetter: cfl, pluralize, matchUsers } = require('../../util/Util.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { getStarEmoji } = require('../../structures/Starboard.js');

module.exports = class UserInfo extends StarbotCommand {
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
				defaultValue: 'message author',
				example: `<@${client.owners[0]}>`,
				code: false,
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
		const { client, args, author, channel, guild } = message;

		let user, member;
		if (!args[0]) {
			user = author;
			member = message.member;
		} else {
			try {
				user = await client.users.fetch(matchUsers(args[0])[0]);

				if (guild) member = await guild.members.fetch(user.id);
			} catch (err) {
				return channel.send('Please provide a valid user resolvable!');
			}
		}

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
			embed.addField('Joined at', moment(member.joinedAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true);

			if (member.nickname) embed.addField('Nickname', member.nickname, true);

			embed.addField('Roles', `${member.roles.cache.size} role${pluralize(member.roles.cache.size)}`, true);

			if (member.displayHexColor !== '#000000') embed.addField('Display colour', member.displayHexColor, true);
			if (member.premiumSince) {
				embed.addField('Last boost date', moment(member.premiumSince).format('dddd, MMMM Do YYYY, h:mm:ss a'), true);
			}
		}

		const data = await user.findCreateFind();
		if (data) {
			embed.addField('Coins', `${data.coins} coin${pluralize(data.coins)}`, true)
				.addField('Reputation', `${data.reputation} reputation`, true);

			if (guild) {
				const localStarCount = guild.stars
					.filter(star => star.author_id === user.id)
					.reduce((a, b) => (a.totalStarCount || 0) + b.totalStarCount, 0);

				embed.addField('Local star count', `${localStarCount} ${getStarEmoji(localStarCount)}`, true);
			}

			const globalStarCount = client.db.models.Star.cache
				.filter(star => star.author_id === user.id)
				.reduce((a, b) => (a.totalStarCount || 0) + b.totalStarCount, 0);

			embed.addField('Global star count', `${globalStarCount} ${getStarEmoji(globalStarCount)}`, true);
		}

		for (let i = 0; i < (embed.fields.length % 3); i++) embed.addField('\u200b', '\u200b', true);

		return channel.send(embed);
	}
};
