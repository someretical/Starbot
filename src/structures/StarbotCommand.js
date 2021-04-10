'use strict';

const path = require('path');
const { oneLine } = require('common-tags');
const { Collection, Permissions } = require('discord.js');
const Logger = require('../util/Logger.js');
const StarbotMessage = require('./extended/StarbotMessage.js');
const Util = require('../util/Util.js');

class StarbotCommand {
	constructor(client, options) {
		this.client = client;
		this.throttles = new Collection();
		this.name = options.name;
		this.aliases = options.aliases || [];
		this.description = options.description || 'none provided';
		this.usage = options.usage || '';
		this.args = options.args || {};
		this.args.required = this.args.required || [];
		this.args.optional = this.args.optional || [];
		this.group = path.basename(options.__dirname);
		this.guildOnly = options.guildOnly;
		this.ownerOnly = options.ownerOnly;
		this.throttleOptions = options.throttle || {
			duration:   5000,
			persistent: false,
		};
		this._permissions = options.permissions || {};
		this._permissions.client = this._permissions.client || [];
		this._permissions.user = this._permissions.user || [];
		this.permissions = {
			client: new Permissions(this._permissions.client).freeze(),
			user:   new Permissions(this._permissions.user).freeze(),
		};
		this._path = `${__dirname}/../commands/${options.group}/${options.name}.js`;
		this._hooks = options.hooks || {
			before: [],
			after:  [],
		};
	}

	reload() {
		delete require.cache[this._path];
		this.client.commands.set(
			this.name,
			require(this._path),
		);

		Logger.info(`Reloaded ${this.name} command`);
	}

	unload() {
		if (!require.cache[this._path]) return;
		delete require.cache[this._path];
		this.client.commands.delete(this.name);

		Logger.info(`Unloaded ${this.name} command`);
	}

	async runBeforeHooks(message) {
		const hooks = [
			this.client.hooks.get('checkMessageCollectors'),
			this.client.hooks.get('checkBlockedChannels'),
			this.client.hooks.get('checkBlockedUsers'),
			this.checkClientPermissions,
			this.checkDMs,
			this.checkOwner,
			this.checkMemberPermissions,
			this.checkThrottles,
		];

		if (this._hooks.before) {
			for (const customHook of this._hooks.before) {
				let replaced = false;

				for (let i = 0; i < hooks.length; i++) {
					if (hooks[i].name === customHook.name) {
						hooks[i] = customHook;

						replaced = true;
						break;
					}
				}

				if (!replaced) hooks.push(customHook);
			}
		}

		for (const hook of hooks) {
			// eslint-disable-next-line no-await-in-loop
			const status = await hook.call(
				this,
				message,
			);

			if (status === true) return true;
			else if (typeof status === 'string') {
				message.channel.embed(status);
				return true;
			}
		}

		return false;
	}

	async runAfterHooks(message) {
		const hooks = [ this.throttle ];

		if (this._hooks.after) {
			for (const customHook of this._hooks.after) {
				let replaced = false;

				for (let i = 0; i < hooks.length; i++) {
					if (hooks[i].name === customHook.name) {
						hooks[i] = customHook;

						replaced = true;
						break;
					}
				}

				if (!replaced) hooks.push(customHook);
			}
		}

		for (const hook of hooks) {
			// eslint-disable-next-line no-await-in-loop
			await hook.call(
				this,
				message,
			);
		}
	}

	checkClientPermissions(message) {
		const channel = message instanceof StarbotMessage ? message.channel : message;

		if (
			channel.type !== 'text'
			|| this.permissions.client.bitfield === 0
		) return false;

		const permissions = channel.permissionsFor(channel.guild.me).missing(this.permissions.client);
		if (permissions.length) {
			const missing = Util.formatPerms(permissions);

			return oneLine`
				I need the following permissions to run this command: ${Util.andJoin(missing.map(p => `\`${p}\``))}
			`;
		}

		return false;
	}

	checkDMs(message) {
		return this.guildOnly && message.channel.type !== 'text'
			? 'This command can only be used in a server!'
			: false;
	}

	checkOwner(message) {
		return this.ownerOnly
			? this.ownerOnly && this.client.isOwner(message.author.id)
				? false
				: 'This command can only be used by the bot owner(s)!'
			: false;
	}

	checkMemberPermissions(message) {
		if (
			!message.guild
			|| !this.permissions.user.bitfield === 0
			|| this.client.isOwner(message.author.id)
		) return false;

		const permissions = message.channel.permissionsFor(message.member).missing(this.permissions.user);
		if (permissions.length) {
			const missing = Util.formatPerms(permissions);

			return oneLine`
				You are missing the following permissions: ${Util.andJoin(missing.map(p => `\`${p}\``))}
			`;
		}

		return false;
	}

	checkThrottles(message) {
		if (
			this.throttleOptions.duration === -1
			|| this.client.isOwner(message.author.id)
		) return false;

		if (this.throttleOptions.persistent) {
			const timestamp = message.author.data.throttles[this.name];

			if (timestamp) {
				const date = Util.dayStart(timestamp);
				const now = Date.now();

				if (date > now) return `Please wait ${Util.formatTime(date - now)} to run this command again.`;

				const throttles = JSON.parse(JSON.stringify(message.author.data.throttles));
				delete throttles[this.name];

				message.author.data.update({ throttles });

				return false;
			}
			return false;
		}
		const key = `${message.channel.id}${message.author.id}${this.name}`;
		const timestamp = this.throttles.get(key);
		const now = Date.now();

		if (timestamp?.endsAt > now) return `Please wait ${Util.formatTime(timestamp.endsAt - now)} to run this command again.`;

		if (timestamp) this.throttles.delete(key);

		return false;
	}

	throttle(message) {
		if (
			this.throttleOptions.duration === -1
			|| this.client.isOwner(message.author.id)
		) return;

		if (this.throttleOptions.persistent) {
			const throttles = JSON.parse(JSON.stringify(message.author.data.throttles));
			throttles[this.name] = Date.now() + this.throttleOptions.duration;

			message.author.data.update({ throttles });
		} else {
			const key = `${message.channel.id}${message.author.id}${this.name}`;
			this.throttles.set(
				key,
				{
					endsAt:  Date.now() + this.throttleOptions.duration,
					timeout: setTimeout(
						() => this.throttles.delete(key),
						this.throttleOptions.duration,
					),
				},
			);
		}
	}
}

module.exports = StarbotCommand;
