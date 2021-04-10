'use strict';

const path = require('path');
const { oneLine } = require('common-tags');
const Discord = require('discord.js');
const { IMAGE_EXTENSIONS, STAR_EMOJI } = require('../util/Constants.js');
const Util = require('../util/Util.js');

class Starboard {
	constructor(guild) {
		this.client = guild.client;
		this.guild = guild;
	}

	get channel() {
		return this.guild.channels.cache.get(this.guild.data.starboard.id);
	}

	async addStar(message, id) {
		const star = await this.client.db.models.Star.findByPk(message.id);

		const data = {
			id:        message.id,
			guildID:   this.guild.id,
			channelID: message.channel.id,
			authorID:  message.author.id,
		};

		if (star?.stars.includes(id)) return undefined;

		data.stars = star ? star.stars.concat(id) : [ id ];

		let embed;
		if (
			this.channel?.permissionsFor(this.guild.me).has(this.client.permissions)
			&& this.guild.data.starboard.enabled
		) {
			if (star?.embedID) {
				try {
					embed = await this.channel.messages.fetch(star.embedID);
				// eslint-disable-next-line no-empty
				} catch (err) {}
			}

			if (data.stars.length >= this.guild.data.starboard.threshold) {
				embed = embed
					? await embed.edit(Starboard.buildEmbed(
						message,
						data.stars.length,
					))
					: await this.channel.send(Starboard.buildEmbed(
						message,
						data.stars.length,
					));
			} else if (embed) await embed.delete();
		}

		data.embedID = embed ? embed.id : null;

		return star ? star.update(data) : this.client.db.models.Star.upsert(data);
	}

	async removeStar(message, id) {
		const star = await this.client.db.models.Star.findByPk(message.id);
		if (!star) return this.fixStar(message);

		const data = {
			id:        message.id,
			guildID:   this.guild.id,
			channelID: message.channel.id,
			authorID:  message.author.id,
			stars:     star.stars.filter(sID => sID !== id),
		};

		if (!data.stars.length) return this.destroyStar(star);

		let embed;
		if (
			this.channel?.permissionsFor(this.guild.me).has(this.client.permissions)
			&& this.guild.data.starboard.enabled
		) {
			if (star?.embedID) {
				try {
					embed = await this.channel.messages.fetch(star.embedID);
				// eslint-disable-next-line no-empty
				} catch (err) {}
			}

			if (data.stars.length >= this.guild.data.starboard.threshold) {
				embed = embed
					? await embed.edit(Starboard.buildEmbed(
						message,
						data.stars.length,
					))
					: await this.channel.send(Starboard.buildEmbed(
						message,
						data.stars.length,
					));
			} else if (embed) await embed.delete();
		}

		data.embedID = embed ? embed.id : null;

		return star ? star.update(data) : this.client.db.models.Star.upsert(data);
	}

	async fixStar(message) {
		const star = await this.client.db.models.Star.findByPk(message.id);

		const reaction = message.reactions.cache.get(this.guild.data.starboard.emoji
			|| STAR_EMOJI);

		if (
			!reaction
			&& star
		) return this.destroyStar(star);

		const stars = await Starboard.fetchAllStars(reaction);
		const filteredUsers = await Starboard.filterUsers(
			message,
			stars.array(),
		);

		if (!filteredUsers.length) return star ? this.destroyStar(star) : undefined;

		const data = {
			id:        message.id,
			guildID:   this.guild.id,
			channelID: message.channel.id,
			authorID:  message.author.id,
			stars:     filteredUsers.map(user => user.id),
		};

		let embed;
		if (
			this.channel?.permissionsFor(this.guild.me).has(this.client.permissions)
			&& this.guild.data.starboard.enabled
		) {
			if (star?.embedID) {
				try {
					embed = await this.channel.messages.fetch(star.embedID);
				// eslint-disable-next-line no-empty
				} catch (err) { }
			}

			if (data.stars.length >= this.guild.data.starboard.threshold) {
				embed = embed
					? await embed.edit(Starboard.buildEmbed(
						message,
						data.stars.length,
					))
					: await this.channel.send(Starboard.buildEmbed(
						message,
						data.stars.length,
					));
			} else if (embed) await embed.delete();
		}

		data.embedID = embed ? embed.id : null;

		return star ? star.update(data) : this.client.db.models.Star.upsert(data);
	}

	async destroyStar(star) {
		if (
			star.embedID
			&& this.channel?.permissionsFor(this.guild.me).has(this.client.permissions)
			&& this.guild.data.starboard.enabled
		) {
			try {
				const embed = await this.channel.messages.fetch(star.embedID);
				await embed.delete();
			// eslint-disable-next-line no-empty
			} catch (err) {}
		}

		return star.destroy();
	}

	static fetchAllStars(reaction) {
		const users = new Discord.Collection();

		const fetch = async after => {
			const fetchedUsers = await reaction.users.fetch({ after });
			if (!fetchedUsers.size) return users;

			for (const [ k, v ] of fetchedUsers) {
				users.set(
					k,
					v,
				);
			}

			return fetch(fetchedUsers.last().id);
		};

		return fetch();
	}

	static filterUsers(message, users) {
		const filter = async user => {
			await user.findCreateFind();

			if (
				user.data.blocked.executor
				|| user.id === message.author.id
				|| message.guild.data.blocked.users.includes(user.id)
			) return false;

			return true;
		};

		// https://advancedweb.hu/how-to-use-async-functions-with-array-filter-in-javascript/#async-filter-with-reduce
		return users.reduce(
			async (filtered, user) => (await filter(user) ? [ ...await filtered, user ] : filtered),
			[],
		);
	}

	static buildEmbed(message, stars) {
		const embed = new Discord.MessageEmbed()
			.setColor(message.client.embedColour)
			.setAuthor(
				message.guild.name,
				message.guild.iconURL(),
				`https://discord.com/channels/${message.guild.id}`,
			)
			.setThumbnail(message.author.avatarURL())
			.setDescription(`[Jump to message](${message.url})`)
			.addField(
				'Author',
				message.author.toString(),
				true,
			)
			.addField(
				'Channel',
				message.channel.toString(),
				true,
			)
			.setFooter(oneLine`
				${stars}
				${Starboard.getStarEmoji(stars)} • 
				${message.id} • 
				${Util.getReadableDate(message.createdAt)}
			`);

		const content = message.embeds[0] ? message.embeds[0].description : message.content;
		if (content) {
			embed.addField(
				'Content',
				content.length > 1021
					? `${content.substring(
						0,
						1021,
					)}...`
					: content,
			);
		}

		const [ mainImage, otherImages ] = Starboard.getImageAttachments(message);
		if (mainImage) embed.setImage(mainImage);

		const attachments = [ ...otherImages, ...Starboard.getOtherAttachments(message) ];
		if (attachments.length) {
			embed.addField(
				'Attachments',
				attachments.join(', '),
			);
		}

		return embed;
	}

	static getImageAttachments(message) {
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|webp)/g;
		let mainImage;
		let otherImages = [];

		const suitableEmbeds = message.embeds
			.filter(embed => embed.image
				&& IMAGE_EXTENSIONS.includes(path.extname(embed.image.url)))
			.map(embed => embed.image.url);

		if (suitableEmbeds.length) {
			mainImage = suitableEmbeds.shift();
			otherImages = suitableEmbeds;
		}

		if (message.content) {
			const links = Array.from(
				message.content.matchAll(linkRegex),
				match => match[0],
			);

			if (!mainImage) mainImage = links.shift();

			otherImages = [ ...otherImages, ...links ];
		}

		const suitableAttachments = message.attachments.filter(file => IMAGE_EXTENSIONS.includes(path.extname(file.url))).map(file => file.url);

		if (suitableAttachments.length) {
			if (!mainImage) mainImage = suitableAttachments.shift();

			otherImages = [ ...otherImages, ...suitableAttachments ];
		}

		return [ mainImage, otherImages.map(url => `[${path.basename(url)}](${url})`) ];
	}

	static getOtherAttachments(message) {
		return message.attachments
			.filter(file => !IMAGE_EXTENSIONS.includes(path.extname(file.url)))
			.map(file => `[${path.basename(file.url)}](${file.url})`);
	}

	static getStarEmoji(stars) {
		if (stars < 5) return '⭐';

		if (stars < 10) return '🌟';

		if (stars < 15) return '✨';

		if (stars < 20) return '💫';

		if (stars < 30) return '🎇';

		if (stars < 40) return '🎆';

		if (stars < 50) return '☄️';

		if (stars < 75) return '🌠';

		if (stars < 100) return '🌌';

		if (stars < 150) return '🌌•⭐';

		if (stars < 200) return '🌌•🌟';

		if (stars < 300) return '🌌•✨';

		if (stars < 400) return '🌌•💫';

		if (stars < 650) return '🌌•🎇';

		if (stars < 900) return '🌌•🎆';

		if (stars < 1400) return '🌌•☄️';

		if (stars < 2400) return '🌌•🌠';

		return '🌌•🌌';
	}
}

module.exports = Starboard;
