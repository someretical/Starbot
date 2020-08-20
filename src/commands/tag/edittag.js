'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class EditTag extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'edittag',
			description: 'edit an existing tag',
			group: 'tag',
			usage: '<tag>',
			args: [{
				name: '<tag>',
				optional: false,
				description: 'the name of the tag',
				example: 'hi',
				code: true,
			}],
			aliases: ['editag'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, author, channel, guild, args } = message;
		const { commands, aliases } = message.client;
		const { cache, models } = message.client.db;
		let tag = guild.tags.get(guild.id + args[0]);

		if (!tag) {
			return channel.embed('Please enter an existing tag name!');
		}

		if (tag.creator_id !== author.id) {
			return channel.embed('Only the owner of a tag can edit it!');
		}

		tag = tag.toJSON();

		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };
		const cancelRe = /^cancel$/i;
		const skip = /^skip$/i;

		channel.awaiting.add(author.id);

		return askNewName();

		function cancel() {
			const embed = client.embed(null, true)
				.setDescription('The tag editing process has been successfully cancelled. All changes have been discarded.')
				.setTitle(`Edit a tag for ${guild.name}`);

			channel.send(embed);

			return channel.awaiting.delete(author.id);
		}

		function timeUp() {
			const embed = client.embed(null, true)
				.setDescription('Sorry but the message collector timed out. Please run the command again.')
				.setTitle(`Edit a tag for ${guild.name}`);

			channel.send(embed);

			return channel.awaiting.delete(author.id);
		}

		async function askNewName() {
			const embed = client.embed(null, true)
				.setTitle(`Edit a tag for ${guild.name}`)
				.setDescription(stripIndents`
					Please enter the new name of the tag.
					Type \`skip\` to skip this step.
					Type \`cancel\` at any time to stop the process.
				`);

			const question = await channel.send(embed);
			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (cancelRe.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				if (commands.has(msg.content) || aliases.has(msg.content)) {
					return channel.embed('A command or alias with this name already exists!');
				}

				if (guild.tags.has(guild.id + msg.content)) {
					return channel.embed('A tag with this name already exists!');
				}

				if (/\s+/g.test(msg.content)) {
					return channel.embed('Sorry but tag names can\'t contain spaces.');
				}

				if (msg.content.length > 32) {
					return channel.embed('Sorry but tag names are capped at 32 characters.');
				}

				tag.name = msg.content;

				return collector.stop();
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askNewResponse();
			});
		}

		async function askNewResponse() {
			const embed = client.embed(null, true)
				.setTitle(`Edit a tag for ${guild.name}`)
				.setDescription(stripIndents`
					Please enter the name of the tag you wish to edit.
					Type \`cancel\` at any time to stop the process.
				`)
				.addField('Placeholders', stripIndents`
					• \`<guild_name>\` will be replaced with the name of the server
					• \`<channel>\` will be replaced with the mention of the channel
					• \`<author>\` will be replaced with the mention of the author
				`);

			const question = await channel.send(embed);
			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (cancelRe.test(msg.content)) {
					return collector.stop('cancel');
				}

				if (skip.test(msg.content)) {
					return collector.stop();
				}

				if (msg.content.length > 1024) {
					return channel.embed('Sorry but tag responses are capped at 1024 characters.');
				}

				tag.newResponse = msg.content;

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
			tag.lastContentUpdate = new Date();
			const [updatedTag] = await guild.queue(() => models.Tag.upsert(tag));

			cache.Tag.delete(guild.id + tag.name);
			cache.Tag.set(guild.id + updatedTag.name, updatedTag);

			const embed = client.embed(null, true)
				.setTitle(`Edit a tag for ${guild.name}`)
				.setDescription(`The \`${updatedTag.name}\` tag has been successfully edited.`);

			await channel.send(embed);

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = EditTag;
