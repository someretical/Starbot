'use strict';

const { oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

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
		let user = null;

		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };
		const re = /^cancel$/i;

		channel.awaiting.add(author.id);

		return askUser();

		function cancel() {
			channel.embed(client.embed(oneLine`
				The unignore process has been successfully cancelled.
				All changes have been discarded.
				`, true)
				.setTitle(`Unblock a user`));

			return channel.awaiting.delete(author.id);
		}

		function timeUp() {
			channel.embed(client.embed(oneLine`
				Sorry but the message collector timed out.
				Please run the command again.
				`, true)
				.setTitle(`Unblock a user`));

			return channel.awaiting.delete(author.id);
		}

		async function askUser() {
			const question = await channel.embed(client.embed(`
				Please mention the user that you wish to unblock.
				Alternatively, you can enter their id.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Unblock a user on ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				const id = (msg.content.match(/^(<@!?\d+>|\d+)$/) || [])[1];
				user = client.users.cache.get(id);

				if (!user) {
					return channel.embed('Please provide a valid user resolvable!');
				}

				return collector.stop({ user_id: id });
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				if (client.isOwner(author.id)) {
					return askGlobal(reason);
				} else {
					return finalise(reason);
				}
			});
		}

		async function askGlobal(obj) {
			const question = await channel.embed(client.embed(`
				Would you like to unblock <@!${obj.user_id}> globally?
				Type \`(y)es\` or \`(n)o\` to confirm.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Unblock a user on ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				const response = (msg.content.match(/^(y(?:es)?|no?)$/i) || [])[1];

				if (!response) {
					return channel.embed(`Please provide a valid response!`);
				}

				return collector.stop({
					user_id: obj.user_id,
					global_: /^y(?:es)?$/i.test(response),
				});
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return finalise(reason);
			});
		}

		async function finalise({ user_id, global_ }) {
			if (global_) {
				const ignored = cache.GlobalIgnore.get(user_id);
				if (ignored) await user.queue(() => ignored.destroy());

				cache.GlobalIgnore.delete(user_id);

				await channel.embed(`<@!${user_id}> has been globally unblocked.`);
			} else {
				const ignored = guild.ignores.get(user_id + guild.id);
				if (ignored) await guild.queue(() => ignored.destroy());

				cache.Ignore.delete(user_id + guild.id);

				await channel.embed(`<@!${user_id}> has been unblocked.`);
			}

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = UnblockUser;
