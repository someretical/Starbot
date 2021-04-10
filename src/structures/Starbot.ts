import fs from 'fs';
import path from 'path';
import Discord from 'discord.js';
import {
	EMBED_COLOUR,
	PACKAGE,
	PERMISSIONS,
	PREFIX,
} from '../util/Constants.js';
import Logger from '../util/Logger.js';
import StarbotDatabase from './StarbotDatabase.js';
import Util from '../util/Util.js';

export default class Starbot extends Discord.Client {
	constructor(options) {
		super(options);

		this.hooks = new Discord.Collection();
		this.commands = new Discord.Collection();
		this.aliases = new Discord.Collection();
		this.commandGroups = [];
		this.db = StarbotDatabase.db;
		this.prefix = PREFIX;
		this.embedColour = EMBED_COLOUR;
		this.ownerID = undefined;
		this.permissions = new Discord.Permissions(PERMISSIONS);
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
				PACKAGE.homepage
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

	async init() {
		Logger.info('Initialising client...');
		this._hrtime = process.hrtime();

		await this.loadHooks();
		await this.loadEvents();
		await this.loadCommands();

		const connect = async () => {
			try {
				await StarbotDatabase.authenticate();

				this.login();
			} catch (err) {
				this.db.close();

				Logger.err('Failed to connect. Retrying in 10 seconds...');
				Logger.stack(err);

				setTimeout(connect, 10000);
			}
		};

		connect();
	}

	async loadHooks() {
		const beforeHooks = fs
			.readdirSync('./dist/src/hooks/before/')
			.filter(file => path.extname(file) === '.js')
			.map(file => `../hooks/before/${file}`);
		const afterHooks = fs
			.readdirSync('./dist/src/hooks/after/')
			.filter(file => path.extname(file) === '.js')
			.map(file => `../hooks/after/${file}`);
		const paths = beforeHooks.concat(afterHooks);
		const importPromises = [];

		for (const p of paths) importPromises.push(import(p));
		const imported = await Promise.all(importPromises);

		paths.forEach((p, i) =>
			this.hooks.set(path.basename(p, path.extname(p)), imported[i].default)
		);

		Logger.info(`Loaded ${paths.length} hook${Util.pluralise(paths.length)}`);
	}

	async loadEvents() {
		const events = fs
			.readdirSync('./dist/src/events/')
			.filter(file => path.extname(file) === '.js');
		const importPromises = [];
		let counter = 0;

		for (const event of events) {
			importPromises.push(import(`../events/${event}`));

			counter++;
		}

		const imported = await Promise.all(importPromises);

		events.forEach((event, i) => {
			const eventPath = `../events/${event}`;
			const eventName = path.basename(eventPath, path.extname(eventPath));

			this.on(eventName, imported[i].default.bind(null, this));
		});

		Logger.info(`Loaded ${counter} event${Util.pluralise(counter)}`);
	}

	async loadCommands() {
		const dirs = fs
			.readdirSync('./dist/src/commands/')
			.map(group => `./dist/src/commands/${group}`)
			.filter(name => fs.lstatSync(name).isDirectory());
		const paths = [];
		const importPromises = [];
		let counter = 0;

		this.commandGroups = dirs;

		for (const dir of dirs) {
			const commandPaths = fs
				.readdirSync(dir)
				.filter(fileName => path.extname(fileName) === '.js')
				.map(fileName => `../commands/${dir.split('/').pop()}/${fileName}`);
			const groupImportPromises = [];

			paths.push(commandPaths);

			for (const commandPath of commandPaths) {
				groupImportPromises.push(import(commandPath));

				counter++;
			}

			importPromises.push(groupImportPromises);
		}

		const imported = await Promise.all(
			importPromises.map(Promise.all, Promise)
		);

		dirs.forEach((dir, i1) => {
			paths[i1].forEach((p, i2) => {
				const command = new imported[i1][i2].default(this);
				command.group = dirs[i1].split('/').pop();

				this.commands.set(command.name, command);
				command.aliases.map(alias => this.aliases.set(alias, command.name));
			});
		});

		Logger.info(
			`Loaded ${dirs.length} group${Util.pluralise(
				dirs.length
			)} & ${counter} command${Util.pluralise(counter)}`
		);
	}
}
