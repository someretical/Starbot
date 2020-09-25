'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers, cancelCmd, timeUp, yes, no } = require('../../util/Util.js');

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
				defaultValue: 'none',
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
		if (await command.checkThrottle(message, 'purgedata')) return undefined;

		if (client.isOwner(author.id)) {
			const id = matchUsers(args[0])[0];

			const user = client.db.models.User.cache.get(id);
			if (!user) {
				return channel.send('The specified user has not been added yet.');
			}

			channel.awaiting.add(author.id);
			const question = await channel.send(stripIndents`
				Please confirm the following ID: \`${id}\`

				Type __y__es to confirm or __n__o to cancel the command.
			`);
			const collector = channel.createMessageCollector(msg => msg.author.id === author.id, { idle: 15000 });

			collector.on('collect', msg => {
				const no_ = no.test(msg.content);
				if (no_) return collector.stop('no');
				if (!yes.test(msg.content) && !no_) return channel.send('Please provide a __y__es/__n__o response!');

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				channel.awaiting.delete(author.id);
				await question.delete();

				if (reason === 'no') return cancelCmd(message);
				if (reason === 'idle') return timeUp(message);

				const purging = await channel.embed(`Purging ${user.toString()}'s data... (this might take a while)`);
				await user.purgeData();
				return purging.edit(client.embed(`${user.toString()} has had their data purged.`));
			});

			return undefined;
		}

		const question = await channel.send(stripIndents`
			Purging your data will delete all data that belongs to you and reset your profile.
			Run \`${client.prefix}datacollection\` to see what data will be deleted.
			If you want to opt out, use the \`${client.prefix}opt-out\` command instead.

			Type __y__es to proceed or __n__o to cancel this command.
		`);
		const collector = channel.createMessageCollector(msg => msg.author.id === author.id, { idle: 15000 });

		collector.on('collect', msg => {
			const no_ = no.test(msg.content);
			if (no_.test(msg.content)) return collector.stop('no');
			if (!yes.test(msg.content) && !no_) return msg.channel.embed('Please provide a __y__es/__n__o response!');

			return collector.stop();
		});

		collector.on('end', async (collected, reason) => {
			await question.delete();

			if (reason === 'no') return cancelCmd(message);
			if (reason === 'time') return timeUp(message);

			const purging = await channel.send('Purging your data... (this might take a while)');
			await author.purgeData();
			return purging.edit('You have successfully purged your data.');
		});

		channel.awaiting.delete(author.id);
		return command.customThrottle(message, 'purgedata', 86400000);
	}
};
