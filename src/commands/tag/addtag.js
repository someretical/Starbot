'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { cancelCmd, timeUp, cancel } = require('../../util/Util.js');

const askName = async (msg, tags) => {
	const obj = {};
	const question = await msg.channel.send(stripIndents`
		Please enter the name of the new tag.
		
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');

		if (m.client.commands.has(m.content.toLowerCase()) || m.client.aliases.has(m.content.toLowerCase())) {
			return m.channel.send('A command or alias with this name already exists!');
		}

		if (tags.some(tag => tag.name === m.content.toLowerCase())) {
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

		return askResponse(msg, tags, obj);
	});
};

const askResponse = async (msg, tags, obj) => {
	const question = await msg.channel.send(stripIndents`
		Please enter the response for the tag \`${obj.name}\`.
		**Placeholders:**
		• \`<guild>\` will be replaced with the name of the server
		• \`<channel>\` will be replaced with the mention of the channel
		• \`<author>\` will be replaced with the mention of the author

		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');

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

		return finalise(msg, tags, obj);
	});
};

const finalise = async (msg, tags, obj) => {
	const finalObj = { ...obj, guild_id: msg.guild.id, creator_id: msg.author.id };
	await msg.client.db.models.Guild.q.add(msg.guild.id, () => msg.client.db.models.Tag.upsert(finalObj));

	const preview = obj.response
		.replace(/<guild>/ig, msg.guild.name)
		.replace(/<channel>/ig, msg.channel.toString())
		.replace(/<author>/ig, msg.author.toString());

	const embed = msg.client.embed(null, true)
		.setThumbnail(msg.author.avatarURL())
		.setTitle('Created tag')
		.setDescription(`
			The \`${obj.name}\` tag has been successfully created.
			${!msg.guild.model.tagsEnabled ? '\n**Warning:** tags are current disabled.' : ''}
		`)
		.addField('Preview', preview.length > 1024 ? `${preview.substring(0, 1021)}...` : preview);

	await msg.channel.send(embed);

	return msg.channel.awaiting.delete(msg.author.id);
};

module.exports = class AddTag extends StarbotCommand {
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
		if (message.guild.tags.filter(t => t.creator_id === message.author.id).size > 10) {
			return message.channel.send(oneLine`
				Sorry but each server member can only have 10 tags maximum. Please delete an existing tag to continue.
			`);
		}

		message.channel.awaiting.add(message.author.id);

		return askName(message, message.guild.tags);
	}
};
