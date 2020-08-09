'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

class EditTag extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'edittag',
			description: 'edit an existing tag',
			group: 'tag',
			usage: '',
			args: [],
			aliases: ['editag'],
			userPermissions: [],
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
		let tag = null;

		const filter = msg => msg.author.id === author.id;
		const options = { time: 15000 };
		const cancelRe = /^cancel$/i;
		const skip = /^skip$/i;

		channel.awaiting.add(author.id);

		return askName();

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

		async function askName() {
			const embed = client.embed(null, true)
				.setTitle(`Edit a tag for ${guild.name}`)
				.setDescription(stripIndents`
					Please enter the name of the tag you wish to edit.
					Type \`cancel\` at any time to stop the process.
				`);

			const question = await channel.send(embed);
			const collector = channel.createMessageCollector(filter, options);

			collector.on('collect', msg => {
				if (cancelRe.test(msg.content)) {
					return collector.stop('cancel');
				}

				tag = guild.tags.get(guild.id + msg.content.toLowerCase());

				if (!tag) {
					return channel.embed('Please enter an existing tag name!');
				}

				if (tag.creator_id !== author.id) {
					return channel.embed('Only the owner of a tag can edit it!');
				}

				return collector.stop({ oldName: msg.content.toLowerCase() });
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askNewName(reason);
			});
		}

		async function askNewName(obj) {
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
					return collector.stop({
						oldName: obj.oldName,
						newName: null,
					});
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

				return collector.stop({
					oldName: obj.oldName,
					newName: msg.content.toLowerCase(),
				});
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return askNewResponse(reason);
			});
		}

		async function askNewResponse(obj) {
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
					return collector.stop({
						oldName: obj.oldName,
						newName: obj.newName,
						newResponse: null,
					});
				}

				if (msg.content.length > 1024) {
					return channel.embed('Sorry but tag responses are capped at 1024 characters.');
				}

				return collector.stop({
					oldName: obj.oldName,
					newName: obj.newName,
					newResponse: msg.content,
				});
			});

			collector.on('end', async (collected, reason) => {
				await question.delete();

				if (reason === 'cancel') return cancel();
				if (reason === 'time') return timeUp();

				return finalise(reason);
			});
		}

		async function finalise({ oldName, newName, newResponse }) {
			if ((tag.name === newName && tag.response === newResponse) || (!newName && !newResponse)) {
				await channel.embed('The command has self-terminated due to no changes being made.');
				return channel.awaiting.delete(author.id);
			}

			const upsertObj = tag.toJSON();
			upsertObj.lastContentUpdate = new Date();

			if (newName) upsertObj.name = newName;
			if (newResponse) upsertObj.response = newResponse;

			const [updatedTag] = await guild.queue(() => models.Tag.upsert(upsertObj));

			if (newName) cache.Tag.delete(guild.id + oldName);

			cache.Tag.set(guild.id + (newName || oldName), updatedTag);

			const embed = client.embed(null, true)
				.setTitle(`Edit a tag for ${guild.name}`)
				.setDescription(stripIndents`
					The \`${oldName}\` tag has been successfully edited.
					${newName ? `Its new name is \`${newName}\`` : ''}
				`);

			await channel.send(embed);

			return channel.awaiting.delete(author.id);
		}
	}
}

module.exports = EditTag;
