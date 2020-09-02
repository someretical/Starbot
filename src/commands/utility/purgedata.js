'use strict';

const { stripIndents } = require('common-tags');
const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers, yes, no } = require('../../util/Util.js');

module.exports = class PurgeData extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'purgedata',
			description: 'Purge any data the bot has stored about you and reset your profile.',
			group: 'utility',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'owner only flag - a valid user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 0,
		});
	}

	async run(message) {
		const { client, args, author, channel, command } = message;
		let user;

		const throttleDuration = command.checkThrottle(message, 'purgedata');
		if (throttleDuration && !client.isOwner(author.id)) {
			const timeLeft = moment(throttleDuration).fromNow(true);

			return channel.embed(`You can purge your data in ${timeLeft}. Please be patient.`);
		}


		if (client.isOwner(author.id)) {
			try {
				user = await client.users.fetch(matchUsers(args[0])[0]);

				await user.add();
				// eslint-disable-next-line no-empty
			} catch (err) {}

			if (!user) {
				return channel.embed('Please provide a valid user resolvable!');
			}

			await user.purgeData();

			return channel.embed(`${user.toString()} has had their data purged.`);
		}

		user = author;

		const confirmEmbed = client.embed(null, true)
			.setTitle(`Confirm your action`)
			.setDescription(stripIndents`
				Purging your data will delete all data that belongs to you (see \`${client.prefix}datacollection\`)
				Your profile will also be reset.
				If you want to opt out, use the \`${client.prefix}opt-out\` command.

				Type \`y(es)\` to proceed or \`n(o)\` to cancel this command.
			`);

		const question = await channel.send(confirmEmbed);
		const collector = channel.createMessageCollector(msg => msg.author.id === author.id, { time: 15000 });

		collector.on('collect', msg => {
			const no_ = no.test(msg.content);
			if (no_.test(msg.content)) {
				return collector.stop('no');
			}

			if (!yes.test(msg.content) && !no_) {
				return msg.channel.embed('Please provide a yes/no response!');
			}

			return collector.stop();
		});

		collector.on('end', async (collected, reason) => {
			await question.delete();

			if (reason === 'no') {
				const embed = client.embed(null, true)
					.setTitle(`Confirm your action`)
					.setDescription('The command has been cancelled.');

				channel.send(embed);

				return channel.awaiting.delete(author.id);
			}

			if (reason === 'time') {
				const embed = client.embed(null, true)
					.setTitle(`Confirm your action`)
					.setDescription('Sorry but the message collector timed out. Please run the command again.');

				channel.send(embed);

				return channel.awaiting.delete(author.id);
			}

			await user.purgeData();
			await command.globalThrottle(message, 'addcoins', 604800000);

			return channel.embed(`You have successfully purged your data.`);
		});

		return channel.awaiting.delete(author.id);
	}
};
