'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { cancelCmd, timeUp, cancel, skip } = require('../../util/Util.js');

const askNewName = async (msg, tags, tag) => {
	const obj = {};
	const question = await msg.channel.send(stripIndents`
		Please enter the new name of the tag.

		Type \`skip\` to skip this step.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (skip.test(m.content)) return collector.stop();

		if (m.client.commands.has(m.content.toLowerCase()) || m.client.aliases.has(m.content.toLowerCase())) {
			return m.channel.send('A command or alias with this name already exists!');
		}

		if (tags.some(t => t.name === m.content.toLowerCase())) {
			return m.channel.send('A tag with this name already exists!');
		}

		// No attachments, embeds, etc
		if (!m.content.length) {
			return m.channel.send('Please ensure your message has plain text content.');
		}

		if (/[\s]/g.test(m.content)) {
			return m.channel.embed('Sorry but tag names can\'t contain spaces.');
		}

		if (m.content.length > 32) {
			return m.channel.embed('Sorry but tag names are capped at 32 characters.');
		}

		obj.name = m.content;
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askNewResponse(msg, tag, obj);
	});
};

const askNewResponse = async (msg, tag, obj) => {
	const question = await msg.channel.send(stripIndents`
		Please enter the new response for the tag \`${obj.name}\`.
		**Placeholders:**
		• \`<guild>\` will be replaced with the name of the server
		• \`<channel>\` will be replaced with the mention of the channel
		• \`<author>\` will be replaced with the mention of the author

		Type \`skip\` to skip this step.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (skip.test(m.content)) return collector.stop();

		if (m.content.length > 1000) {
			return m.channel.send('Sorry but tag responses are capped at 1000 characters.');
		}

		obj.response = m.content;
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return finalise(msg, tag, obj);
	});
};

const finalise = async (msg, tag, obj) => {
	if (tag.name === obj.name && tag.response === obj.response) {
		msg.channel.send('The command has self-terminated due to no changes being made.');
		return msg.channel.awaiting.delete(msg.author.id);
	}

	const updateObj = { ...tag.toJSON(), ...obj, lastContentUpdate: new Date() };
	await msg.client.db.models.Guild.q.add(msg.guild.id, () => msg.client.db.models.Tag.upsert(updateObj));

	const preview = obj.response
		.replace(/<guild>/ig, msg.guild.name)
		.replace(/<channel>/ig, msg.channel.toString())
		.replace(/<author>/ig, msg.author.toString());

	const embed = msg.client.embed(null, true)
		.setThumbnail(msg.author.avatarURL())
		.setTitle('Edited tag')
		.setDescription(stripIndents`
			The \`${tag.name}\` tag has been successfully edited.
			${obj.name && tag.name !== obj.name ? `\nIts new name is \`${obj.name}\`.` : ''}
		`)
		.addField('Preview', preview.length > 1024 ? `${preview.substring(0, 1021)}...` : preview);

	await msg.channel.send(embed);

	return msg.channel.awaiting.delete(msg.author.id);
};

module.exports = class EditTag extends StarbotCommand {
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
		if (!message.args[0]) {
			return message.channel.send('Please provide a tag name!');
		}

		const tag = message.guild.tags.find(t => t.name === message.args[0].toLowerCase());
		if (!tag) {
			return message.channel.send('Please enter an existing tag name!');
		}

		if (tag.creator_id !== message.author.id) {
			return message.channel.send('Only the owner of a tag can edit it!');
		}

		message.channel.awaiting.add(message.author.id);

		return askNewName(message, message.guild.tags, tag);
	}
};
