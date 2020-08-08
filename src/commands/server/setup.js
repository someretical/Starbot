'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class Setup extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'setup',
			description: 'setup the bot to run on a server',
			group: 'server',
			usage: '',
			args: [],
			aliases: [],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, author, channel, guild } = message;
		const { cache, models } = message.client.db;
		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };
		const re = /^cancel$/i;
		const skip = /^skip$/i;
		const upsertObj = guild.settings.toJSON();

		channel.awaiting.add(author.id);

		return askPrefix();

		function cancel() {
			channel.embed(client.embed(oneLine`
				The setup process has been successfully cancelled.
				All changes have been discarded.
				`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			return channel.awaiting.delete(author.id);
		}

		function timeUp() {
			channel.embed(client.embed(oneLine`
				Sorry but the message collector timed out.
				Please run the command again.
				`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			return channel.awaiting.delete(author.id);
		}

		async function askPrefix() {
			const question = await channel.embed(client.embed(stripIndents`
				Please enter the custom prefix for this server. It must be between 1 and 10 characters long.
				The current prefix is \`${upsertObj.prefix}\`.
				Type \`skip\` to skip this step.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				const sanitised = msg.content.trim();

				if (sanitised.length > 10 || !msg.content.length) {
					return channel.embed('Please choose a prefix that is between 1 and 10 characters long!');
				}

				upsertObj.prefix = sanitised;
				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askTag(reason);
			});
		}

		async function askTag() {
			const question = await channel.embed(client.embed(stripIndents`
				Would you like to ${upsertObj.tagsEnabled ? 'disable' : 'enable'} tags? Please type yes or no.
				They are currently ${upsertObj.tagsEnabled ? 'enabled' : 'disabled'}.				
				Type \`skip\` to skip this step.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				const yes = /^y(?:es)?$/i;
				const no = /^no?$/i;

				if (upsertObj.tagsEnabled && yes.test(msg.content) || !upsertObj.tagsEnabled && no.test(msg.content)) {
					upsertObj.tagsEnabled = false
				} else if (upsertObj.tagsEnabled && no.test(msg.content) || !upsertObj.tagsEnabled && yes.test(msg.content)) {
					upsertObj.tagsEnabled = true;
				} else {
					return channel.embed('Please provide a yes/no answer!');
				}

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askIgnoredChannels(reason);
			});
		}

		async function askIgnoredChannels() {
			const question = await channel.embed(client.embed(stripIndents`
				Please type in any text channels you would like the bot to ignore. Both channel mentions and IDs are accepted.
				You will have 60 seconds in this wizard to add all the channels.
				Type \`done\` when you are done.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, { time: 60000 });

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (/^done$/i.test(msg.content)) {
					return collector.stop();
				}

				const id = (msg.content.match(/^(?:<#(\d+)>|(\d+))$/) || [])[1];
				const channel_ = guild.channels.cache.get(id);

				if (!channel_) {
					return channel.embed('Sorry but the bot couldn\'t find that channel.');
				}

				if (!['text', 'news'].includes(channel_.type)) {
					return channel.embed('Please provide a text channel!');
				}

				if (upsertObj.ignoredChannels.includes(channel_.id)) {
					return channel.embed(`${channel_.toString()} is already ignored by the bot!`);
				}

				upsertObj.ignoredChannels.push(channel_.id);

				return channel.embed(`${channel_.toString()} has been added to the ignore list.`);
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askStarboard();
			});
		}

		async function askStarboard() {
			const question = await channel.embed(client.embed(stripIndents`
				Would you like to ${upsertObj.starboardEnabled ? 'disable' : 'enable'} the starboard? Please type yes or no.
				The starboard is currently ${upsertObj.starboardEnabled ? 'enabled' : 'disabled'}.				
				Type \`skip\` to skip this step.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				const yes = /^y(?:es)?$/i;
				const no = /^no?$/i;

				if (upsertObj.starboardEnabled && yes.test(msg.content) || !upsertObj.starboardEnabled && no.test(msg.content)) {
					upsertObj.starboardEnabled = false;
				} else if (upsertObj.starboardEnabled && no.test(msg.content) || !upsertObj.starboardEnabled && yes.test(msg.content)) {
					upsertObj.starboardEnabled = true;
				} else {
					return channel.embed('Please provide a yes/no answer!');
				}

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				if (upsertObj.starboardEnabled) return askStarboardChannel();

				return finalise();
			});
		}

		async function askStarboardChannel() {
			const starboard = guild.starboard.channel;
			const question = await channel.embed(client.embed(stripIndents`
				Please set the starboard channel.
				${starboard ? `The current starboard is ${starboard.toString()}.` : 'There is no starboard channel right now.'}
				Type \`skip\` to skip this step.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				const id = (msg.content.match(/^(?:<#(\d+)>|(\d+))$/) || [])[1];
				const channel_ = guild.channels.cache.get(id);

				if (!channel_) {
					return channel.embed('Sorry but the bot couldn\'t find that channel.');
				}

				if (!channel_.type !== 'text') {
					return channel.embed('Please provide a non-news text channel!');
				}

				upsertObj.starboard_id = channel_.id;

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askReactionThreshold();
			});
		}

		async function askReactionThreshold() {
			const question = await channel.embed(client.embed(stripIndents`
				Please set the number of stars a message needs in order to be posted on the starboard.
				The current reaction threshold is ${upsertObj.reactionThreshold} ⭐.
				Type \`skip\` to skip this step.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Setup wizard for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				const limit = Number(msg.content);
				if (Number.isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
					return channel.embed('Please provide a valid integer!');
				}

				upsertObj.reactionThreshold = limit;

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
			let displayedChannels = 'None';

			if (upsertObj.ignoredChannels.length) {
				displayedChannels = upsertObj.ignoredChannels.slice(0, 10).map(id => `<#${id}>`).join(', ')
					.concat(upsertObj.ignoredChannels.length > 10 ? ` and ${upsertObj.ignoredChannels.length - 10} more` : '');
			}

			upsertObj.ignoredChannels = JSON.stringify(upsertObj.ignoredChannels);
			const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

			cache.Guild.set(guild.id, updatedGuild);

			const embed = client.embed(null, true)
				.setTitle(`Settings for ${guild.name}`)
				.setThumbnail(guild.iconURL())
				.addField('Prefix', `\`${upsertObj.prefix}\``, true)
				.addField('Starboard', upsertObj.starboard_id ? `<#${upsertObj.starboard_id}>` : 'None', true)
				.addField('Starboard enabled?', upsertObj.starboardEnabled ? 'Yes' : 'No', true)
				.addField('Reaction threshold', `${upsertObj.reactionThreshold} ⭐`, true)
				.addField('Tags enabled?', upsertObj.tagsEnabled ? 'Yes' : 'No', true)
				.addField('Ignored channels', displayedChannels, true);
			
			await channel.embed(embed);

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = Setup;
