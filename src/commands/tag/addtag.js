'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class AddTag extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'addtag',
			description: 'add a custom command on a server',
			group: 'tag',
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
		const { commands, aliases } = message.client;
		const { cache, models } = message.client.db;

		if (guild.tags.filter(t => t.creator_id === author.id).size > 10) {
			return channel.embed(oneLine`
				Sorry but each server member can only have 10 tags maximum.
				Please delete an existing tag to continue.
			`);
		}

		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };
		const re = /^cancel$/i;

		channel.awaiting.add(author.id);

		return askName();

		function cancel() {
			channel.embed(client.embed(oneLine`
				The tag creation process has been successfully cancelled.
				All changes have been discarded.
				`, true)
				.setTitle(`Create a new tag for ${guild.name}`));

			return channel.awaiting.delete(author.id);
		}

		function timeUp() {
			channel.embed(client.embed(oneLine`
				Sorry but the message collector timed out.
				Please run the command again.
				`, true)
				.setTitle(`Create a new tag for ${guild.name}`));

			return channel.awaiting.delete(author.id);
		}

		async function askName() {
			const question = await channel.embed(client.embed(stripIndents`
				Please enter the name of the new tag.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.setTitle(`Create a new tag for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (commands.has(msg.content.toLowerCase()) || aliases.has(msg.content.toLowerCase())) {
					return channel.embed('A command or alias with this name already exists!');
				}

				if (guild.tags.has(guild.id + msg.content.toLowerCase())) {
					return channel.embed('A tag with this name already exists!');
				}

				if (/\s+/g.test(msg.content)) {
					return channel.embed('Sorry but tag names can\'t contain spaces.');
				}

				if (msg.content.length > 32) {
					return channel.embed('Sorry but tag names are capped at 32 characters.');
				}

				return collector.stop({ name: msg.content.toLowerCase() });
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askResponse(reason);
			});
			return null;
		}

		async function askResponse(obj) {
			const question = await channel.embed(client.embed(stripIndents`
				Please enter the response for the tag \`${obj.name}\`.
				Type \`cancel\` at any time to stop the process.
			`, true)
				.addField('Placeholders', stripIndents`
				• \`<guild_name>\` will be replaced with the name of the server
				• \`<channel_name>\` will be replaced with the mention of the channel
				• \`<author_name>\` will be replaced with the mention of the author
			`)
				.setTitle(`Create a new tag for ${guild.name}`));

			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (re.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (msg.content.length > 1024) {
					return channel.embed('Sorry but tag responses are capped at 1024 characters.');
				}

				return collector.stop({ name: obj.name, response: msg.content });
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return finalise(reason);
			});
			return null;
		}

		async function finalise({ name, response }) {
			const [tag] = await guild.queue(() => models.Tag.upsert({
				guild_id: guild.id,
				name: name,
				response: response,
				creator_id: author.id,
			}));

			cache.Tag.set(guild.id + name, tag);

			await channel.embed(client.embed(`The \`${name}\` tag has been successfully created.`, true)
				.setTitle(`Create a new tag for ${guild.name}`));

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = AddTag;
