'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers, cancelCmd, timeUp, yes, no } = require('../../util/Util.js');

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
				defaultValue: 'none',
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

		if (args[0] && client.isOwner(author.id)) {
			const id = matchUsers(args[0])[0];
			let user, exists = false;

			try {
				user = await client.users.fetch(id);

				await user.add();

				exists = true;
				// eslint-disable-next-line no-empty
			} catch (err) {}

			if (!id) {
				return channel.send('Please provide a valid user resolvable!');
			}

			if (client.db.models.OptOut.cache.has(id)) {
				return channel.embed(`<@${id}> has already opted out!`);
			}

			channel.awaiting.add(author.id);
			const question = await channel.send(stripIndents`
				Please confirm the following ID: \`${id}\`\n${!exists ? `**Warning:** this ID could not be fetched!\n` : ''}
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

				const _reason = args[1] ? args[1].substring(0, 256) : 'None';
				await client.db.models.OptOut.q.add(id, () => client.db.models.OptOut.upsert({
					user_id: id,
					executor_id: author.id,
					reason: _reason,
				}));

				return channel.embed(`<@${id}> has been globally blocked.`);
			});

			return undefined;
		}

		if (client.isOwner(author.id)) {
			return channel.send('You cannot opt out as an owner!');
		}

		const question = await channel.send(stripIndents`
			${oneLine`
				Opting out will make the bot delete all data that belongs to you (see \`${client.prefix}datacollection\`)
				and will also make the bot ignore you **permanently**.`}
			${oneLine`Once you have opted out, the only record the bot will store about you is your ID
			(to ensure it knows to ignores you).`}

			Type __y__es to proceed or __n__o to cancel this command.
		`);
		const collector = channel.createMessageCollector(msg => msg.author.id === author.id, { idle: 15000 });

		collector.on('collect', msg => {
			const _no = no.test(msg.content);
			if (_no.test(msg.content)) return collector.stop('no');
			if (!yes.test(msg.content) && !_no) return channel.send('Please provide a __y__es/__n__o response!');

			return collector.stop();
		});

		collector.on('end', async (collected, reason) => {
			channel.awaiting.delete(author.id);
			await question.delete();

			if (reason === 'no') return cancelCmd(message);
			if (reason === 'idle') return timeUp(message);

			const purging = await channel.send('Opting you out... (this might take a while)');

			await client.db.models.OptOut.q.add(author.id, () => client.db.models.OptOut.upsert({
				user_id: author.id,
				executor_id: client.user.id,
				reason: 'OPTOUT_COMMAND',
			}));

			await author.purgeData();

			return purging.edit('You have successfully opted out.');
		});

		return undefined;
	}
};
