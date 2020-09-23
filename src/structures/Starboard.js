'use strict';

const path = require('path');
const Discord = require('discord.js');
const moment = require('moment');

class Starboard {
	constructor(guild) {
		this.client = guild.client;
		this.guild = guild;
		this.channel = undefined;
	}

	getStars(id = undefined) {
		if (typeof id === 'string') {
			return this.client.db.models.Star.cache.get(id);
		}

		return this.client.db.models.Star.cache.filter(star => star.guild_id === this.guild.id);
	}

	async _checkValidity(message, user_id = undefined, cmd = false) {
		// Cmd parameter makes sure repeated calls are not made to the database
		// As commands would have already checked user_id for discrepencies
		const _guild = await this.guild.findCreateFind();

		this.channel = this.guild.channels.cache.get(_guild.starboard_id);

		// Check if message author has opted out
		const _1 = message.author.ignored;
		// Check if channel is ignored in guild only as this cannot be run in a DM channel
		const _2 = _guild.ignoredChannels.includes(message.channel.id);

		if (_1 || _2) return false;

		// Commands will have already validated the user_id
		if (user_id && !cmd) {
			// Check if user_id has opted out
			const _3 = this.client.db.models.OptOut.cache.has(user_id);
			const _4 = _guild.ignoredUsers.includes(user_id);
			const _5 = message.author.id === user_id && !this.client.isOwner(user_id);

			let member;
			try {
				member = await this.guild.members.fetch(user_id);
			// eslint-disable-next-line no-empty
			} catch (err) {}
			const _6 = member ? member.roles.cache.some(({ id }) => _guild.ignoredRoles.includes(id)) : false;

			if (_3 || _4 || _5 || _6) return false;
		}

		return true;
	}

	async _addNewStar(message, user_id = undefined) {
		const _guild = await this.guild.findCreateFind();
		const optedOut = this.client.db.models.OptOut.cache;
		const reactions = { msg: [], cmd: [] };

		// User_id only provided if adding star via command for first time
		if (user_id) reactions.cmd.push(user_id);

		// Reactions can be fetched from the message
		const reaction = message.reactions.cache.get('⭐');
		if (reaction) {
			const reactors = await Starboard.fetchAllReactors(reaction);

			reactors.map(({ id }) =>
				!reactions.cmd.includes(id) && !_guild.ignoredUsers.includes(id) && !optedOut.has(id) ?
					reactions.msg.push(id) :
					undefined,
			);
		}

		if (reactions.msg.length + reactions.cmd.length === 0) return undefined;

		const [star] = await this.client.db.models.Star.upsert({
			message_id: message.id,
			author_id: message.author.id,
			channel_id: message.channel.id,
			guild_id: message.guild.id,
			botMessage_id: null,
			reactions: reactions,
		});

		return this._displayStar(message, star);
	}

	async _displayStar(message, star) {
		let botMessage;
		const reactions = star.reactions.msg.length + star.reactions.cmd.length;
		const _guild = await this.guild.findCreateFind();

		if (this.channel && _guild.starboardEnabled && reactions >= _guild.reactionThreshold) {
			const ignored = await this.channel.ignored();

			if (!ignored && this.channel.clientHasPermissions()) {
				botMessage = star.botMessage_id ? await this.channel.messages.fetch(star.botMessage_id) : undefined;

				const send = () => this.channel.send(Starboard.buildStarboardMessage(message, reactions));

				try {
					if (botMessage) {
						botMessage = await this.channel.messages.cache
							.get(botMessage.id)
							.edit(Starboard.buildStarboardMessage(message, reactions));
					} else {
						botMessage = await send();
					}
				} catch (err) {
					botMessage = await send();
				}
			}
		}

		return star.update({ botMessage_id: botMessage ? botMessage.id : null });
	}

	async addStar(message, user_id, cmd = false) {
		const invalid = await this._checkValidity(message, user_id, cmd);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._addStar(message, user_id, cmd));
	}

	async _addStar(message, user_id, cmd) {
		const star = this.getStars(message.id);
		if (!star) return this._addNewStar(message, cmd ? user_id : undefined);

		// Commands will have already validated the user_id
		if (!cmd) {
			if (star.reactions.msg.includes(user_id) || star.reactions.cmd.includes(user_id)) return undefined;
		}

		const _reactions = star.toJSON().reactions;
		_reactions[cmd ? 'cmd' : 'msg'].push(user_id);

		await star.update({ reactions: _reactions });

		return this._displayStar(message, star);
	}

	async removeStar(message, user_id, cmd = false) {
		const invalid = await this._checkValidity(message, user_id, cmd);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._removeStar(message, user_id, cmd));
	}

	async _removeStar(message, user_id, cmd) {
		const star = this.getStars(message.id);
		if (!star) return this._addNewStar(message);

		const index = star.reactions[cmd ? 'cmd' : 'msg'].indexOf(user_id);
		if (index === -1) return undefined;

		const _reactions = star.toJSON().reactions;
		_reactions[cmd ? 'cmd' : 'msg'].splice(index, 1);

		if (_reactions.cmd.length + _reactions.msg.length === 0) {
			return this._destroyStar(star);
		} else {
			await star.update({ reactions: _reactions });

			return this._displayStar(message, star);
		}
	}

	async fixStar(message) {
		const invalid = await this._checkValidity(message);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._fixStar(message));
	}

	async _fixStar(message) {
		const star = this.getStars(message.id);
		if (!star) return this._addNewStar(message);
		const _reactions = star.toJSON().reactions;

		const _guild = await this.guild.findCreateFind();
		const optedOut = this.client.db.models.OptOut.cache;
		_reactions.cmd = star.reactions.cmd.filter(id =>
			!_guild.ignoredUsers.includes(id) && !optedOut.has(id),
		);

		const reaction = message.reactions.cache.get('⭐');
		if (reaction) {
			const reactors = await Starboard.fetchAllReactors(reaction);
			_reactions.msg = [];

			reactors.map(({ id }) =>
				!star.reactions.cmd.includes(id) &&
				!_guild.ignoredUsers.includes(id) &&
				!optedOut.has(id) ? _reactions.msg.push(id) : undefined,
			);
		}

		if (_reactions.cmd.length + _reactions.msg.length === 0) {
			return this._destroyStar(star);
		} else {
			await star.update({ reactions: _reactions });

			return this._displayStar(message, star);
		}
	}

	destroyStar(star) {
		return this.client.db.models.Star.q.add(star.message_id, () => this._destroyStar(star));
	}

	async _destroyStar(star) {
		await star.destroy();

		const starboard = this.channel;
		if (starboard) {
			try {
				const botMessage = await starboard.messages.fetch(star.botMessage_id);
				if (botMessage) botMessage.delete();
			// eslint-disable-next-line no-empty
			} catch (err) {}
		}
	}

	static fetchAllReactors(reaction) {
		const users = new Discord.Collection();

		const fetch = async options => {
			const fetchedUsers = await reaction.users.fetch(options);
			if (!fetchedUsers.size) return users;

			for (const [id, user] of fetchedUsers) users.set(id, user);

			return fetch({ after: fetchedUsers.lastKey() });
		};

		return fetch();
	}

	static buildStarboardMessage(message, reactionCount) {
		const starEmoji = Starboard.getStarEmoji(reactionCount);
		const createdAt = moment(message.createdAt).format('Do MMM YYYY');

		const embed = new Discord.MessageEmbed()
			.setColor(message.client.embedColour)
			.setAuthor(message.guild.name, message.guild.iconURL())
			.setThumbnail(message.author.avatarURL())
			.addField('Channel', `<#${message.channel.id}>\n[Jump to message](${message.url})`, true)
			.setFooter(`${message.pinned ? '📌 • ' : ''}${reactionCount} ${starEmoji} • ${createdAt}`);

		const imageURL = Starboard.getImageAttachment(message);
		if (imageURL) embed.setImage(imageURL);

		let content = message.embeds[0] ? message.embeds[0].description : message.content;
		if (content && content.length > 1021) content = `${content.substring(0, 1021)}...`;
		if (content) embed.addField('Content', content, true);

		const otherAttachment = Starboard.getOtherAttchement(message);
		if (otherAttachment) embed.attachFiles([otherAttachment]);

		return embed;
	}

	static getImageAttachment(message) {
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;
		let imageURL;

		const msgEmbed = message.embeds.find(e => e.image && extensions.includes(path.extname(e.image.url)));
		if (msgEmbed) imageURL = msgEmbed.image.url;

		const imageAttachment = message.attachments.find(file => extensions.includes(path.extname(file.url)));
		if (imageAttachment) imageURL = imageAttachment.url;

		if (message.content && !imageURL) {
			const link = message.content.match(linkRegex);
			if (link && extensions.includes(path.extname(link[0]))) imageURL = link[0];
		}

		return imageURL;
	}

	static getOtherAttchement(message) {
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

		return message.attachments.find(file => !extensions.includes(path.extname(file.url)));
	}

	static getStarEmoji(count) {
		if (count < 5) return '⭐';
		if (count < 10) return '🌟';
		if (count < 15) return '✨';
		if (count < 20) return '💫';
		if (count < 30) return '🎇';
		if (count < 40) return '🎆';
		if (count < 50) return '☄️';
		if (count < 75) return '🌠';
		if (count < 100) return '🌌';
		if (count < 150) return '🌌•⭐';
		if (count < 200) return '🌌•🌟';
		if (count < 300) return '🌌•✨';
		if (count < 400) return '🌌•💫';
		if (count < 650) return '🌌•🎇';
		if (count < 900) return '🌌•🎆';
		if (count < 1400) return '🌌•☄️';
		if (count < 2400) return '🌌•🌠';
		return '🌌•🌌';
	}
}

module.exports = Starboard;
