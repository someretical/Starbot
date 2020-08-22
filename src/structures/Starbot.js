'use strict';

const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const { Op } = require('sequelize');
const Logger = require('../util/Logger.js');
const { pluralize: s } = require('../util/Util.js');
const StarbotCommand = require('./StarbotCommand.js');
const StarbotDatabase = require('./StarbotDatabase.js');

class Starbot extends Discord.Client {
	constructor(options) {
		super(options);

		this.commands = new Discord.Collection();
		this.aliases = new Discord.Collection();
		this.sequelize = StarbotDatabase.db;
		this.prefix = process.env.PREFIX;
		this.embedColour = process.env.EMBED_COLOUR;
		this.owners = JSON.parse(process.env.OWNERS);
		this.basePermissions = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'];
		this.db = { models: {}, cache: {} };
		this.ready = false;
	}

	snowflake(timestamp) {
		return Discord.SnowflakeUtil.generate(timestamp);
	}

	embed(text = null, fancy = false) {
		const homepageURL = require(path.resolve('package.json')).homepage;
		const newEmbed = new Discord.MessageEmbed().setColor(this.embedColour);

		if (typeof text === 'string') newEmbed.setDescription(text);

		if (fancy) {
			newEmbed.setAuthor(this.user.username, this.user.displayAvatarURL(), homepageURL).setTimestamp();
		}

		return newEmbed;
	}

	isOwner(id) {
		return this.owners.includes(id);
	}

	async run() {
		this.loadEvents();
		this.loadCommands();

		await StarbotDatabase.authenticate();
		await this.cacheDatabase();

		await this.login(process.env.TOKEN).catch(Logger.err);
	}

	loadEvents() {
		try {
			let events = fs.readdirSync('./src/events/').filter(file => file.endsWith('.js'));
			let eventCount = 0;

			for (const event of events) {
				this.on(event.split('.').shift(), require(`../events/${event}`).bind(null, this));

				delete require.cache[require.resolve(`../events/${event}`)];
				eventCount++;
			}

			Logger.info(`Loaded ${eventCount} event${s(eventCount)}`);
		} catch (err) {
			Logger.err(err, 'Failed to load events');

			process.exit();
		}
	}

	loadCommands() {
		try {
			let commandCount = 0;

			let groups = fs.readdirSync('./src/commands/')
				.map(name => `./src/commands/${name}/`)
				.filter(dir => fs.lstatSync(dir).isDirectory());

			for (const group of groups) {
				let commandPaths = fs.readdirSync(group)
					.map(name => `${group}${name}`)
					.filter(file => file.endsWith('.js'));

				for (const commandPath of commandPaths) {
					let command = require(`../${commandPath.match(/\.\/src\/(.+)/)[1]}`);

					if (!(command.prototype instanceof StarbotCommand)) {
						Logger.warn(`Skipping command ${commandPath}`);

						continue;
					}

					command = new command(this);

					this.commands.set(command.name, command);

					commandCount++;

					for (const alias of command.aliases) {
						this.aliases.set(alias, command.name);
					}
				}
			}

			Logger.info(`Loaded ${groups.length} group${s(groups.length)} & ${commandCount} command${s(commandCount)}`);
		} catch (err) {
			Logger.err(err, 'Failed to load commands');

			process.exit();
		}
	}

	async cacheDatabase() {
		const { models } = StarbotDatabase.db;

		this.db.models = models;

		for (const model in models) {
			this.db.cache[model.toString()] = new Discord.Collection();

			if (model.toString() === 'Star') {
				// Don't want to cache stars that have probably gone stale
				// eslint-disable-next-line no-await-in-loop
				const stars = await models[model].findAll({
					where: {
						updatedAt: {
							[Op.gt]: new Date(Date.now() - 86400000),
						},
					},
				});

				for (const star of stars) {
					this.db.cache.Star.set(star.message_id, star);
				}
				continue;
			}

			// eslint-disable-next-line no-await-in-loop
			const records = await models[model].findAll();

			for (const record of records) {
				const { primaryKeyAttributes } = models[model];
				let primaryKey = null;

				if (primaryKeyAttributes.length > 1) {
					primaryKey = primaryKeyAttributes.map(field => record.get(field)).join('');
				} else if (model.toString() === 'Tag') {
					// Sequelieze doesn't allow updating of primary keys so tag name has to be stored as a regular
					// field but still treated as part of a composite primary key for the cached Tag models
					primaryKey = record.guild_id + record.name;
				} else {
					primaryKey = record.get(primaryKeyAttributes[0]);
				}

				this.db.cache[model].set(primaryKey, record);
			}
		}

		this.ready = true;

		Logger.info('Successfully cached models');
	}
}

module.exports = Starbot;
