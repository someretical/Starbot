'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers, yes: yesRe, no: noRe, cancel: cancelRe } = require('../../util/Util.js');

class UnblockUser extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unblockuser',
			description: 'allow someone to use the bot again',
			group: 'server',
			usage: '',
			args: [],
			aliases: ['whitelist', 'allowlist'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, author, channel, guild } = message;
		const { cache } = message.client.db;
		let ignore = null;

		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };

		channel.awaiting.add(author.id);

		return askUser();

		function cancel() {
			const embed = client.embed(null, true)
				.setTitle(`Unblock a user on ${guild.name}`)
				.setDescription(stripIndents`
					The unignore process has been successfully cancelled.
					All changes have been discarded.
				`);

			channel.send(embed);

			return channel.awaiting.delete(author.id);
		}

		function timeUp() {
			const embed = client.embed(null, true)
				.setTitle(`Unblock a user on ${guild.name}`)
				.setDescription(stripIndents`
					Sorry but the message collector timed out.
					Please run the command again.
				`);

			channel.send(embed);

			return channel.awaiting.delete(author.id);
		}

		async function askUser() {
			const embed = client.embed(null, true)
				.setTitle(`Unblock a user on ${guild.name}`)
				.setDescription(stripIndents`
					Please mention the user that you wish to unblock.
					Alternatively, you can enter their id.
					Type \`cancel\` at any time to stop the process.
				`);

			const question = await channel.send(embed);
			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				const invalid = () => channel.embed('Please provide a valid user resolvable!');
				if (cancelRe.test(msg.content)) {
					return collector.stop('cancel');
				}

				const id = matchUsers(msg.content)[0];
				const globalUser = cache.GlobalIgnore.get(id);
				ignore = guild.ignores.get(id + guild.id);

				if (!ignore && !globalUser) return invalid();
				if (!ignore && globalUser && !client.isOwner(author.id)) {
					return channel.embed('Only an owner can globally unblock this user!');
				}

				ignore = !ignore && globalUser ? globalUser : ignore;
				if (!ignore) return invalid();

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				if (client.isOwner(author.id) && ignore.guild_id) return askGlobal();
				return finalise();
			});
		}

		async function askGlobal() {
			const embed = client.embed(null, true)
				.setTitle(`Unblock a user on ${guild.name}`)
				.setDescription(stripIndents`
					Would you like to unblock <@!${ignore.user_id}> globally?
					Type \`(y)es\` or \`(n)o\` to confirm.
					Type \`cancel\` at any time to stop the process.
				`);

			const question = await channel.send(embed);
			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				const invalid = () => channel.send('Please provide a yes/no answer!');
				if (cancelRe.test(msg.content)) {
					return collector.stop('cancel');
				}

				const yes = yesRe.test(msg.content);
				const no = noRe.test(msg.content);
				if (!yes && !no) return invalid();

				if (no) {
					return collector.stop('cancel');
				}

				if (!yes) return invalid();

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return finalise();
			});
		}

		async function finalise() {
			let userObj = null;

			try {
				userObj = await client.users.fetch(ignore.user_id);
				// eslint-disable-next-line no-empty
			} catch (err) {}

			if (ignore.guild_id) {
				await guild.queue(() => ignore.destroy());

				cache.Ignore.delete(ignore.user_id + guild.id);

				await channel.embed(`${userObj ? userObj.toString() : `<@${ignore.user_id}>`} has been unblocked.`);
			} else {
				if (userObj) {
					await userObj.queue(() => ignore.destroy());
				} else {
					await ignore.destroy();
				}

				cache.GlobalIgnore.delete(ignore.user_id);

				await channel.embed(`${userObj ? userObj.toString() : `<@${ignore.user_id}>`} has been globally unblocked.`);
			}

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = UnblockUser;
