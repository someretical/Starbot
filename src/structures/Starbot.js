'use strict';

const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const Constants = require('../util/Constants.js');
const Logger = require('../util/Logger.js');
const StarbotDatabase = require('./StarbotDatabase.js');
const { pluralise: s } = require('../util/Util.js');

class Starbot extends Discord.Client {
	constructor(options) {
		super(options);

		this.hooks = new Discord.Collection();
		this.commands = new Discord.Collection();
		this.aliases = new Discord.Collection();
		this.commandGroups = [];
		this.db = StarbotDatabase.db;
		this.prefix = Constants.PREFIX;
		this.embedColour = Constants.EMBED_COLOUR;
		this.ownerID = undefined;
		this.permissions = new Discord.Permissions(Constants.PERMISSIONS);
		this._ready = false;
		this._hrtime = undefined;
	}

	embed(options) {
		const embed = new Discord.MessageEmbed().setColor(this.embedColour);

		if (!options) return embed;

		if (typeof options === 'string') return embed.setDescription(options);

		if (options.author && this._ready) {
			embed.setAuthor(
				this.user.username,
				this.user.displayAvatarURL(),
				Constants.PACKAGE.homepage,
			);

			options.ts = true;
			options.tn = true;
		}

		if (options.ts) embed.setTimestamp();

		if (options.tn) embed.setThumbnail(this.user.displayAvatarURL());

		return embed;
	}

	isOwner(id) {
		if (!this._ready) return false;

		return this.ownerID === id;
	}

	init() {
		Logger.info('Initialising client...');
		this._hrtime = process.hrtime();

		this.loadHooks();
		this.loadEvents();
		this.loadCommands();

		const connect = async () => {
			try {
				await StarbotDatabase.authenticate();

				this.login();
			} catch (err) {
				this.db.close();

				Logger.err('Failed to connect. Retrying in 10 seconds...');
				Logger.stack(err);

				setTimeout(
					connect,
					10000,
				);
			}
		};

		connect();
	}

	loadHooks() {
		const beforeHooks = fs.readdirSync('./src/hooks/before/')
			.filter(file => path.extname(file) === '.js')
			.map(file => `../hooks/before/${file}`);
		const afterHooks = fs.readdirSync('./src/hooks/after/')
			.filter(file => path.extname(file) === '.js')
			.map(file => `../hooks/after/${file}`);
		const paths = beforeHooks.concat(afterHooks);

		for (const p of paths) {
			this.hooks.set(
				path.basename(
					p,
					path.extname(p),
				),
				require(p),
			);
		}

		Logger.info(`Loaded ${paths.length} hook${s(paths.length)}`);
	}

	loadEvents() {
		const events = fs.readdirSync('./src/events/')
			.filter(file => path.extname(file) === '.js');
		let counter = 0;

		for (const event of events) {
			const eventPath = `../events/${event}`;
			const eventName = path.basename(
				eventPath,
				path.extname(eventPath),
			);

			this.on(
				eventName,
				require(eventPath).bind(
					null,
					this,
				),
			);
			delete require.cache[require.resolve(eventPath)];

			counter++;
		}

		Logger.info(`Loaded ${counter} event${s(counter)}`);
	}

	loadCommands() {
		const dirs = fs.readdirSync('./src/commands/')
			.map(group => `./src/commands/${group}`)
			.filter(name => fs.lstatSync(name).isDirectory());
		let counter = 0;

		this.commandGroups = dirs;

		for (const dir of dirs) {
			const commandPaths = fs.readdirSync(dir)
				.filter(fileName => path.extname(fileName) === '.js')
				.map(fileName => `../commands/${dir.split('/').pop()}/${fileName}`);

			for (const commandPath of commandPaths) {
				const command = new (require(commandPath))(this);

				this.commands.set(
					command.name,
					command,
				);
				command.aliases.map(alias => this.aliases.set(
					alias,
					command.name,
				));
				counter++;
			}
		}

		Logger.info(`Loaded ${dirs.length} group${s(dirs.length)} & ${counter} command${s(counter)}`);
	}
}

module.exports = Starbot;
