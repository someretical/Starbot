'use strict';

const path = require('path');
const Discord = require('discord.js');
const moment = require('moment');

class Starboard {
	constructor(guild) {
		this.client = guild.client;
		this.guild = guild;
		this.channel = undefined;
		this._guild = undefined;
	}

	getStars(id = undefined) {
		if (typeof ids === 'string') {
			return this.client.db.models.Star.findByPk(id);
		}

		return this.client.db.models.Star.findAll({ where: { guild_id: this.guild.id } });
	}

	async _checkValidity(message, user_id = undefined, cmd = false) {
		// Cmd parameter makes sure repeated calls are not made to the database
		// As commands would have already checked user_id for discrepencies
		if (!this._guild) {
			this._guild = await this.guild.findOrCreate();
		} else {
			await this._guild.reload();
		}

		this.channel = this.guild.channels.cache.get(this._guild.starboard_id);

		// Check if message author has opted out
		const _1 = await message.author.ignored();
		// Check if channel is ignored in guild only as this cannot be run in a DM channel
		const _2 = this._guild.ignoredChannels.includes(message.channel.id);

		if (_1 || _2) return false;

		if (user_id && !cmd) {
			// Check if user_id has opted out
			const _3 = await this.client.db.models.OptOut.findByPk(user_id);
			const _4 = this._guild.ignoredUsers.includes(user_id);

			let member;
			try {
				member = await this.guild.members.fetch(user_id);
			// eslint-disable-next-line no-empty
			} catch (err) {}
			const _5 = member ? member.roles.cache.some(({ id }) => this._guild.ignoredRoles.includes(id)) : false;

			if (_3 || _4 || _5) return false;
		}

		return true;
	}

	async _addNewStar(message, user_id = undefined) {
		const optedOut = (await this.client.db.models.OptOut.findAll()).map(o => o.user_id);
		const reactions = { msg: [], cmd: [] };

		// User_id only provided if adding star via command for first time
		if (user_id) reactions.cmd.push(user_id);

		const reaction = message.reactions.cache.get('⭐');
		if (reaction) {
			const reactors = await Starboard.fetchAllReactors(reaction);

			reactors.map(({ id }) =>
				!reactions.cmd.includes(id) && !this._guild.ignoredUsers.includes(id) && !optedOut.includes(id) ?
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
		let botMessage_id;
		const reactions = star.reactions.msg.length + star.reactions.cmd.length;

		if (this.channel && this._guild.starboardEnabled && reactions >= this._guild.reactionThreshold) {
			const ignored = await this.channel.ignored();

			if (!ignored && this.channel.clientHasPermissions()) {
				botMessage_id = star.botMessage_id ? await this.channel.messages.fetch(star.botMessage_id) : undefined;

				const send = async () => {
					const { id } = await this.channel.send(Starboard.buildStarboardMessage(message, reactions));
					return id;
				};

				try {
					if (botMessage_id) {
						await this.channel.messages.cache
							.get(botMessage_id)
							.edit(Starboard.buildStarboardMessage(message, reactions));
					} else {
						botMessage_id = await send();
					}
				} catch (err) {
					botMessage_id = await send();
				}
			}
		}

		return star.save();
	}

	async addStar(message, user_id, cmd = false) {
		const invalid = await this._checkValidity(message, user_id);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._addStar(message, user_id, cmd));
	}

	async _addStar(message, user_id, cmd) {
		const star = await this.getStars(message.id);
		if (!star) return this._addNewStar(message, cmd ? user_id : undefined);

		if (star.reactions.msg.includes(user_id) || star.reactions.cmd.includes(user_id)) return undefined;
		star.reactions[cmd ? 'cmd' : 'msg'].push(user_id);

		return this._displayStar(message, star);
	}

	async removeStar(message, user_id, cmd) {
		const invalid = await this._checkValidity(message, user_id);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._removeStar(message, user_id, cmd));
	}

	async _removeStar(message, user_id, cmd) {
		const star = await this.getStars(message.id);
		if (!star) return this._addNewStar(message);

		const index = star.reactions[cmd ? 'cmd' : 'msg'].indexOf(user_id);
		if (index === -1) return undefined;

		star.reactions[cmd ? 'cmd' : 'msg'].splice(index, 1);

		return star.reactions.cmd.length + star.reactions.msg.length === 0 ?
			this._destroyStar(star) :
			this._displayStar(message, star);
	}

	async fixStar(message) {
		const invalid = await this._checkValidity(message);
		if (!invalid) return undefined;

		return this.client.db.models.Star.q.add(message.id, () => this._fixStar(message));
	}

	async _fixStar(message) {
		const star = await this.getStars(message.id);
		if (!star) return this._addNewStar(message);

		const optedOut = (await this.client.db.models.OptOut.findAll()).map(o => o.user_id);
		star.reactors.cmd = star.reactors.cmd.filter(id =>
			!this._guild.ignoredUsers.includes(id) && !optedOut.includes(id),
		);

		const reaction = message.reactions.cache.get('⭐');
		if (reaction) {
			const reactors = await Starboard.fetchAllReactors(reaction);
			star.reactors.msg = [];

			reactors.map(({ id }) =>
				!star.reactors.cmd.includes(id) &&
				!this._guild.ignoredUsers.includes(id) &&
				!optedOut.includes(id) ? star.reactions.msg.push(id) : undefined,
			);
		}

		return star.reactions.cmd.length + star.reactions.msg.length === 0 ?
			this._destroyStar(star) :
			this._displayStar(message, star);
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
				if (botMessage) await botMessage.delete();
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
			.setFooter(`${reactionCount} ${starEmoji} • ${createdAt}`);

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
