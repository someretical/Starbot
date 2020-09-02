'use strict';

const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const Logger = require('../util/Logger.js');
const { pluralize: s } = require('../util/Util.js');
const StarbotDatabase = require('./StarbotDatabase.js');

class Starbot extends Discord.Client {
	constructor(options) {
		super(options);

		this.commands = new Discord.Collection();
		this.aliases = new Discord.Collection();
		this.commandGroups = [];
		this.db = StarbotDatabase.db;
		this.prefix = process.env.PREFIX;
		this.embedColour = process.env.EMBED_COLOUR;
		this.owners = JSON.parse(process.env.OWNERS);
		this.basePermissions = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'];
		this._ready = false;
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

		const login = async () => {
			try {
				await this.login(process.env.TOKEN);
			} catch (err) {
				Logger.err(err, 'Failed to log in. Retrying in 30 seconds...');

				setTimeout(login, 30000);
			}
		};

		login();
	}

	loadEvents() {
		const events = fs.readdirSync(path.resolve(__dirname, '..', 'events'))
			.filter(file => path.extname(file) === '.js');
		let counter = 0, eventPath = '', eventName = '';

		for (const event of events) {
			eventPath = path.resolve(__dirname, '..', 'events', event);
			eventName = path.basename(eventPath, path.extname(eventPath));

			this.on(eventName, require(eventPath).bind(null, this));
			delete require.cache[require.resolve(eventPath)];

			counter++;
		}

		Logger.info(`Loaded ${counter} event${s(counter)}`);
	}

	loadCommands() {
		const dirPaths = fs.readdirSync(path.resolve(__dirname, '..', 'commands'))
			.map(group => path.resolve(__dirname, '..', 'commands', group))
			.filter(dir => fs.lstatSync(dir).isDirectory());
		let counter = 0, commandPaths = [], command;

		for (const dir of dirPaths) {
			commandPaths = fs.readdirSync(dir)
				.filter(file => path.extname(file) === '.js')
				.map(name => path.resolve(dir, name));

			for (const commandPath of commandPaths) {
				command = new (require(commandPath))(this);

				this.commands.set(command.name, command);
				command.aliases.map(alias => this.aliases.set(alias, command.name));
				counter++;
			}
		}

		Logger.info(`Loaded ${dirPaths.length} group${s(dirPaths.length)} & ${counter} command${s(counter)}`);
	}
}

module.exports = Starbot;
