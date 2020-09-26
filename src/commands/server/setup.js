'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchChannels, cancelCmd, timeUp, fancyJoin, pluralize,
	yes, no, cancel, skip } = require('../../util/Util.js');

const askPrefix = async (msg, _guild) => {
	const updated = {};
	const question = await msg.channel.send(stripIndents`
		Please enter the custom prefix for this server. It must be between 1 and 10 characters long.
		The current prefix is \`${_guild.prefix}\`.
		
		Type \`skip\` to skip this step.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (skip.test(m.content)) return collector.stop();

		const sanitised = m.content.trim();
		if (sanitised.length > 10 || !m.content.length) {
			return m.channel.send('Please choose a prefix that is between 1 and 10 characters long!');
		}

		updated.prefix = sanitised;
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askTag(msg, _guild, updated);
	});
};

const askTag = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Would you like to ${_guild.tagsEnabled ? 'disable' : 'enable'} tags? 
		They are currently ${_guild.tagsEnabled ? 'enabled' : 'disabled'}.

		Please type __y__es or __n__o.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');

		const _yes = yes.test(m.content);
		const _no = no.test(m.content);
		if (!_yes && !_no) return m.channel.send('Please provide a __y__es/__n__o answer!');

		updated.tagsEnabled = (_guild.tagsEnabled && _no) || (!_guild.tagsEnabled && _yes);
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askBlockedChannels(msg, _guild, updated);
	});
};

const askBlockedChannels = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Please type in any text channels you would like the bot to block.
		Both channel mentions and IDs are accepted.

		Type \`done\` when you are done.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (/^done$/i.test(m.content)) return collector.stop();

		const channels = matchChannels(m.content);
		if (!channels.length) {
			return m.channel.send('Please provide a valid channel resolvable!');
		}

		if (channels.some(id => !m.guild.channels.cache.has(id))) {
			return m.channel.send('One (or more) of the provided channels could not be found.');
		}

		if (channels.some(id => !['text', 'news'].includes(m.guild.channels.cache.get(id).type))) {
			return m.channel.send('One (or more) of the provided channels were not text channels.');
		}

		if (channels.some(id => _guild.blockedChannels.includes(id))) {
			return m.channel.send('One (or more) of the provided channels are already blocked.');
		}

		updated.blockedChannels = _guild.blockedChannels.concat(channels);

		return m.channel.send(
			channels.length === 1 ?
				`The <#${channels[0]}> channel has been blocked.` :
				channels.length < 11 ?
					`The following channels were blocked: ${fancyJoin(channels.map(id => `<#${id}>`))}` :
					`${channels.length} channels${pluralize(channels.length)} were blocked.`,
		);
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askBlockedRoles(msg, _guild, updated);
	});
};

const askBlockedRoles = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Please type in any roles you would like the bot to block. 
		Both channel mentions and IDs are accepted.

		Type \`done\` when you are done.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (/^done$/i.test(m.content)) return collector.stop();

		const roles = matchChannels(m.content);
		if (!roles.length) {
			return m.channel.send('Please provide a valid role resolvable!');
		}

		if (roles.some(id => !m.guild.roles.cache.has(id))) {
			return m.channel.send('One (or more) of the provided roles could not be found.');
		}

		if (roles.some(id => _guild.blockedRoles.includes(id))) {
			return m.channel.send('One (or more) of the provided roles are already blocked.');
		}

		updated.blockedRoles = _guild.blockedRoles.concat(roles);

		return m.channel.send(
			roles.length === 1 ?
				m.client.embed(`The <@&${roles[0]}> role has been blocked.`) :
				roles.length < 11 ?
					m.client.embed(`The following roles were blocked: ${fancyJoin(roles.map(id => `<@&${id}>`))}`) :
					`${roles.length} roles${pluralize(roles.length)} were blocked.`,
		);
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askStarboard(msg, _guild, updated);
	});
};

const askStarboard = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Would you like to ${_guild.starboardEnabled ? 'disable' : 'enable'} the starboard?
		The starboard is currently ${_guild.starboardEnabled ? 'enabled' : 'disabled'}.

		Please type __y__es or __n__o.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');

		const _yes = yes.test(m.content);
		const _no = no.test(m.content);
		if (!_yes && !_no) return m.channel.send('Please provide a __y__es/__n__o answer!');

		updated.starboardEnabled = (_guild.starboardEnabled && _no) || (!_guild.starboardEnabled && _yes);
		return collector.stop(updated.starboardEnabled);
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);
		if (reason === true) return askStarboardChannel(msg, _guild, updated);

		return finalise(msg, _guild, updated);
	});
};

const askStarboardChannel = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Please set the starboard channel. It must be a non-news text channel.
		The current starboard ${_guild.starboard_id ? ` is <#${_guild.starboard_id}>.` : 'has not been set yet.'}

		Type \`skip\` to skip this step.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (skip.test(m.content)) return collector.stop();

		const channel = m.guild.channels.cache.get(matchChannels(m.content)[0]);
		if (!channel) {
			return m.channel.send('Please provide a valid channel resolvable!');
		}

		if (!['text'].includes(channel.type)) {
			return m.channel.send('Please provide a **text** channel!');
		}

		if (_guild.starboard_id === channel.id) {
			return m.channel.send(`<#${channel.id}> is already the starboard!`);
		}

		updated.starboard_id = channel.id;
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return askReactionThreshold(msg, _guild, updated);
	});
};

const askReactionThreshold = async (msg, _guild, updated) => {
	const question = await msg.channel.send(stripIndents`
		Please set the number of stars a message needs in order to be posted on the starboard.
		The current reaction threshold is ${_guild.reactionThreshold} ⭐.

		Type \`skip\` to skip this step.
		Type \`cancel\` at any time to stop the process.
	`);
	const collector = msg.channel.createMessageCollector(m => m.author.id === msg.author.id, { idle: 15000 });

	collector.on('collect', m => {
		if (cancel.test(m.content)) return collector.stop('cancel');
		if (skip.test(m.content)) return collector.stop();

		const limit = parseInt(m.content);
		if (Number.isNaN(limit) || !Number.isSafeInteger(limit) || limit < 1) {
			return m.channel.send('Please provide a valid integer larger than 0!');
		}

		if (_guild.reactionThreshold === limit) {
			return m.channel.send(`The limit is already ${limit} ⭐!`);
		}

		updated.reactionThreshold = limit;
		return collector.stop();
	});

	collector.on('end', async (collected, reason) => {
		await question.delete();

		if (reason === 'cancel') return cancelCmd(msg);
		if (reason === 'idle') return timeUp(msg);

		return finalise(msg, _guild, updated);
	});
};

const finalise = async (msg, _guild, updated) => {
	await msg.client.db.models.Guild.q.add(msg.guild.id, () => _guild.update(updated));

	const roles = _guild.blockedRoles.length;
	const users = _guild.blockedUsers.length;
	const channels = _guild.blockedChannels.length;
	const embed = msg.client.embed(null, true)
		.setTitle(`Settings for ${msg.guild.name}`)
		.setThumbnail(msg.guild.iconURL())
		.addField('Prefix', `\`${_guild.prefix}\``, true)
		.addField('Starboard', _guild.starboard_id ? `<#${_guild.starboard_id}>` : 'None', true)
		.addField('Starboard enabled?', _guild.starboardEnabled ? 'Yes' : 'No', true)
		.addField('Reaction threshold', `${_guild.reactionThreshold} ⭐`, true)
		.addField('Tags enabled?', _guild.tagsEnabled ? 'Yes' : 'No', true)
		.addField('Blocked roles', `${roles} role${pluralize(roles)}`, true)
		.addField('Blocked users', `${users} user${pluralize(users)}`, true)
		.addField('Blocked channels', `${channels} channel${pluralize(channels)}`, true)
		.addField('\u200b', '\u200b', true);

	await msg.channel.send(embed);

	return msg.channel.awaiting.delete(msg.author.id);
};

module.exports = class Setup extends StarbotCommand {
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
		message.channel.awaiting.add(message.author.id);

		return askPrefix(message, message.guild.model);
	}
};
