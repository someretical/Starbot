'use strict';

const Discord = require('discord.js');

class Util {
	static pluralize(number) {
		return number === 1 ? '' : 's';
	}

	static get yes() {
		return /^y(?:es)?$/i;
	}

	static get no() {
		return /^no?$/i;
	}

	static get cancel() {
		return /^cancel$/i;
	}

	static get skip() {
		return /^skip$/i;
	}

	static capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	static fancyJoin(string, ampersand = false) {
		if (string instanceof Array) string = string.join(', ');

		const n = string.lastIndexOf(',');

		string = string.slice(0, n) + string.slice(n).replace(',', ampersand ? ' &' : ' and');

		return string;
	}

	static formatErrorDiscord(error, code) {
		return `:( An error has occurred for some reason. Please contact the bot owner and provide the error stack below:`
			.concat(`\n\`\`\`js\n// ERROR_CODE: ${code}\n\n${Util.sanitise(error.stack)}\n\`\`\``);
	}

	static async cancelCmd(msg) {
		await msg.channel.send('The command has been cancelled.');
		return msg.channel.awaiting.delete(msg.author.id);
	}

	static async timeUp(msg) {
		await msg.channel.send('Sorry but the message collector timed out. Please run the command again.');
		return msg.channel.awaiting.delete(msg.author.id);
	}

	static sanitise(result, regex = false) {
		let cleansed = result.toString()
			.replace(process.env.TOKEN, 'here is the token you retard')
			.replace(/@(everyone|here)/g, '@\u200b$1');

		if (process.env.USER_DIRECTORY) {
			cleansed = cleansed.replace(new RegExp(process.env.USER_DIRECTORY, 'ig'), 'USER_DIRECTORY');
		}

		return !regex ? cleansed : cleansed.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
	}

	static prettifyPermissions(perms, autoCap = true, mode = 'all') {
		if (perms instanceof Discord.Permissions) {
			perms = Object.entries(perms.serialize());

			perms = perms.filter(perm => mode === 'all' ? true : mode === 'has' ? perm[1] : !perm[1]).map(perm => perm[0]);
		}

		perms = perms.map(perm => {
			let spaced = perm.replace(/_/g, ' ').toLowerCase();

			if (autoCap) spaced = Util.capitaliseFirstLetter(spaced);

			return spaced;
		});

		return perms;
	}

	static matchMessageURL(str, includeChannel = false) {
		let id, url;
		try {
			url = new URL(str);
		} catch (err) {
			url = includeChannel ? undefined : (str.match(/^(\d+)$/) || [])[1];
		}

		if (!url) return undefined;

		if (url instanceof URL) {
			if (!url.pathname) return undefined;

			const [, channel_id, message_id] = url.pathname.match(/\/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/) || [];
			if (!message_id) return undefined;

			if (includeChannel) {
				return { channel_id: channel_id, message_id: message_id };
			}

			id = message_id;
		} else {
			id = url;
		}

		return id;
	}

	static matchUsers(str) {
		if (typeof str !== 'string' || /[^<>@!\d\s]/.test(str)) return [];

		const matches = Array.from(str.matchAll(/(?<=(?:\s+|^)<@!?)\d+(?=>(?:\s+|$))|(?<=\s+|^)\d+(?=\s+|$)/g));

		return matches.map(arr => arr[0]);
	}

	static matchChannels(str) {
		if (typeof str !== 'string' || /[^<>#\d\s]/.test(str)) return [];

		const matches = Array.from(str.matchAll(/(?<=(?:\s+|^)<#)\d+(?=>(?:\s+|$))|(?<=\s+|^)\d+(?=\s+|$)/g));

		return matches.map(arr => arr[0]);
	}

	static matchRoles(str) {
		if (typeof str !== 'string' || /[^<>&\d\s]/.test(str)) return [];

		const matches = Array.from(str.matchAll(/(?<=(?:\s+|^)<&)\d+(?=>(?:\s+|$))|(?<=\s+|^)\d+(?=\s+|$)/g));

		return matches.map(arr => arr[0]);
	}
}

module.exports = Util;
