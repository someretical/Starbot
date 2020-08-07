'use strict';

const path = require('path');
const Discord = require('discord.js');
const moment = require('moment');
const StarbotQueue = require('./StarbotQueue.js');

class Starboard {
	constructor(guild) {
		this.client = guild.client;
		this.guild = guild;
		this.queues = new Discord.Collection();
	}

	get channel() {
		return this.guild.channels.cache.get(this.guild.settings.starboard_id);
	}

	get stars() {
		return this.client.db.models.Star.findAll({ where: { guild_id: this.guild.id } });
	}

	// Returns model or error
	async getStarModel(message_id) {
		let star = this.client.db.cache.Star.get(message_id);

		if (star) {
			return star;
		} else {
			star = await this.client.db.models.Star.findByPk(message_id);
			if (!star) return null;

			this.client.db.cache.Star.set(message_id, star);

			return star;
		}
	}

	// Returns promise
	queue(message_id, promiseFunction) {
		let queue = this.queues.get(message_id);

		if (!queue) {
			this.queues.set(message_id, new StarbotQueue());

			queue = this.queues.get(message_id);
		}

		return new Promise((resolve, reject) => {
			queue.add(() => promiseFunction().then(value => {
				if (!queue.length) this.queues.delete(message_id);

				resolve(value);
			}).catch(err => {
				reject(err);

				throw err;
			}));
		});
	}

	fixStar(message) {
		return this.queue(message.id, () => this._fixStar(message));
	}

	// Returns null or error OR 1 if message is invalid
	async _fixStar(message) {
		const ignored = this.guild.ignores;
		const globalIgnored = this.client.db.cache.GlobalIgnore;
		const reactObj = { reactors: [], cmdReactors: [] };

		const star = await this.getStarModel(message.id);
		if (star) {
			reactObj.cmdReactors = JSON.parse(star.cmdReactors)
				.filter(id => !globalIgnored.has(id) && !ignored.has(id + this.guild.id));
		}

		const starReaction = message.reactions.cache.get('⭐');
		if (starReaction) {
			const allReactors = await Starboard.fetchAllReactors(starReaction);

			reactObj.reactors = allReactors
				.filter(reactor =>
					!reactObj.cmdReactors.includes(reactor.id) &&
					!reactor.ignored &&
					!ignored.has(reactor.id + this.guild.id),
				).keyArray();
		}

		reactObj.combinedLength = reactObj.reactors.length + reactObj.cmdReactors.length;
		if (reactObj.combinedLength === 0) {
			if (star) {
				await this._destroyStar(star);
				return null;
			}
			return 1;
		}

		return this._updateStar(message, reactObj, star);
	}

	addStar(message, user_id, cmd = false) {
		return this.queue(message.id, () => this._addStar(message, user_id, cmd));
	}

	// Returns null or error
	async _addStar(message, user_id, cmd) {
		const star = await this.getStarModel(message.id);
		const reactObj = { reactors: [], cmdReactors: [] };

		if (star) {
			const parsed = cmd ? JSON.parse(star.cmdReactors) : JSON.parse(star.reactors);

			if (!cmd) {
				const cmdReactors = JSON.parse(star.cmdReactors);
				if (cmdReactors.includes(user_id)) return;
			}

			parsed.push(user_id);

			reactObj.cmdReactors = cmd ? parsed : JSON.parse(star.cmdReactors);
			reactObj.reactors = cmd ? JSON.parse(star.reactors) : parsed;
		} else {
			if (cmd) reactObj.cmdReactors.push(user_id);

			const starReaction = message.reactions.cache.get('⭐');
			if (starReaction) {
				const ignored = this.guild.ignores;
				const allReactors = await Starboard.fetchAllReactors(starReaction);

				reactObj.reactors = allReactors
					.filter(reactor =>
						!reactObj.cmdReactors.includes(reactor.id) &&
						!reactor.ignored &&
						!ignored.has(reactor.id + this.guild.id),
					).keyArray();
			}
		}

		reactObj.combinedLength = reactObj.reactors.length + reactObj.cmdReactors.length;
		await this._updateStar(message, reactObj, star);
	}

	removeStar(message, user_id, cmd = false) {
		return this.queue(message.id, () => this._removeStar(message, user_id, cmd));
	}

	// Returns null or error
	async _removeStar(message, user_id, cmd) {
		const star = await this.getStarModel(message.id);
		const reactObj = { reactors: [], cmdReactors: [] };

		if (star) {
			const parsed = cmd ? JSON.parse(star.cmdReactors) : JSON.parse(star.reactors);
			const index = parsed.indexOf(user_id);


			if (index > -1) parsed.splice(index, 1);

			reactObj.cmdReactors = cmd ? parsed : JSON.parse(star.cmdReactors);
			reactObj.reactors = cmd ? JSON.parse(star.reactors) : parsed;
		} else {
			const starReaction = message.reactions.cache.get('⭐');
			if (starReaction) {
				const ignored = this.guild.ignores;
				const allReactors = await Starboard.fetchAllReactors(starReaction);

				reactObj.reactors = allReactors
					.filter(reactor =>
						!reactObj.cmdReactors.includes(reactor.id) &&
						!reactor.ignored &&
						!ignored.has(reactor.id + this.guild.id),
					).keyArray();
			}
		}

		reactObj.combinedLength = reactObj.reactors.length + reactObj.cmdReactors.length;
		if (reactObj.combinedLength === 0) {
			if (star) await this._destroyStar(star);
			return;
		}

		await this._updateStar(message, reactObj, star);
	}
	// Returns null or error
	async _updateStar(message, reactObj, star) {
		const { starboardEnabled, reactionThreshold } = message.guild.settings;
		const starboard = message.guild.starboard.channel;
		let botMessage_id = null;

		if (starboard && starboard.clientHasPermissions() && starboardEnabled) {
			if (star) {
				const botMessage = await starboard.messages.fetch(star.botMessage_id);

				if (botMessage) botMessage_id = botMessage.id;
			}

			if (reactObj.combinedLength >= reactionThreshold) {
				if (botMessage_id) {
					await starboard.messages.cache
						.get(botMessage_id)
						.edit(Starboard.buildStarboardMessage(message, reactObj.combinedLength));
				} else {
					const { id } = await starboard.send(Starboard.buildStarboardMessage(message, reactObj.combinedLength));
					botMessage_id = id;
				}
			} else if (botMessage_id) {
				await starboard.messages.cache.get(botMessage_id).delete();
			}
		}

		const [updatedStar] = await this.client.db.models.Star.upsert({
			message_id: message.id,
			author_id: message.author.id,
			channel_id: message.channel.id,
			guild_id: message.guild.id,
			botMessage_id: botMessage_id,
			reactors: JSON.stringify(reactObj.reactors),
			cmdReactors: JSON.stringify(reactObj.cmdReactors),
		});

		this.client.db.cache.Star.set(message.id, updatedStar);
		return null;
	}

	destroyStar(star) {
		return this.queue(star.message_id, () => this._destroyStar(star));
	}

	// Returns null or error
	async _destroyStar(star) {
		await star.destroy();

		this.client.db.cache.Star.delete(star.message_id);

		const starboard = this.channel;

		if (starboard) {
			const botMessage = await starboard.messages.fetch(star.botMessage_id);

			if (botMessage) await botMessage.delete();
		}
		return null;
	}

	// Returns promise with collection of all reactors mapped by user id
	static fetchAllReactors(reaction) {
		const users = new Discord.Collection();

		const fetch = async options => {
			const fetchedUsers = await reaction.users.fetch(options);
			if (!fetchedUsers.size) return users;

			for (const [id, user] of fetchedUsers) users.set(id, user);

			return fetch({ before: fetchedUsers.lastKey() });
		};

		return fetch();
	}

	// Returns array with message embed and message attachment
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

	// Returns image URL or null
	static getImageAttachment(message) {
		let imageURL = null;
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/;

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

	// Returns messageattachment object or null
	static getOtherAttchement(message) {
		const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

		return message.attachments.find(file => !extensions.includes(path.extname(file.url)));
	}

	// Returns emoji
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
