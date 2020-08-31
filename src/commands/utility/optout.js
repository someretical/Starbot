'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers, yes, no } = require('../../util/Util.js');

module.exports = class OptOut extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'optout',
			description: oneLine`make the bot globally block you so it cannot collect anymore data about you.
										Your existing data will be purged (except for the global block record)`,
			group: 'utility',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'an unblocked user mention or a valid ID (only usable for owners)',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['opt-out'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel } = message;
		let user;

		if (client.isOwner(author.id)) {
			try {
				user = await client.users.fetch(matchUsers(args[0])[0]);

				await user.add();
				// eslint-disable-next-line no-empty
			} catch (err) {}

			let reason = args[1] || 'None';

			if (!user || user.ignored) {
				return channel.embed('Please provide a valid user resolvable!');
			}

			const [record] = await user.queue(() => client.db.models.GlobalIgnore.upsert({
				user_id: author.id,
				executor_id: client.user.id,
				reason: reason,
			}));

			client.db.cache.GlobalIgnore.set(user.id, record);

			return channel.embed(`${user.toString()} has been globally blocked. Reason: ${reason}`);
		}

		user = author;

		const confirmEmbed = client.embed(null, true)
			.setTitle(`Confirm your action`)
			.setDescription(stripIndents`
				Opting out will make the bot delete all data that belongs to you (see \`${client.prefix}datacollection\`)
				It will also make the bot ignore you permanently so there is no going back after you provide confirmation.
				Once you have opted out, the only record the bot will store about you is your ID (to ensure it ignores you).

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

			const [record] = await user.queue(() => client.db.models.GlobalIgnore.upsert({
				user_id: author.id,
				executor_id: client.user.id,
				reason: 'Opt-out',
			}));

			client.db.cache.GlobalIgnore.set(user.id, record);

			await user.purgeData();

			return channel.embed(`You have successfully opted out.`);
		});

		return undefined;
	}
};
