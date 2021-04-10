import { oneLine } from 'common-tags';
import Discord from 'discord.js';
import { MONTHS, TIMESCALE } from './Constants.js';

export default class Util {
	static pluralise(number) {
		return number === 1 ? '' : 's';
	}

	static upperFirstChar(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	static andJoin(arr, ampersand = false) {
		return arr
			.map((str, index) =>
				index === arr.length - 2
					? `${str} ${ampersand ? '&' : 'and'}`
					: index === arr.length - 1
					? str
					: `${str}, `
			)
			.join('');
	}

	static getDiscordError(error, location) {
		return ':( An error has occurred for some reason. Please contact the bot owner and provide the error stack below:'.concat(
			`\n\`\`\`js\n// Location: ${location}\n\n${Util.sanitise(
				error.stack
			)}\n\`\`\``
		);
	}

	static cancelCmd(message) {
		message.channel.awaiting.delete(message.author.id);

		return message.channel.send('The command has been cancelled.');
	}

	static timeUp(message) {
		message.channel.awaiting.delete(message.author.id);

		return message.channel.send(
			'Sorry but the message collector timed out. Please run the command again.'
		);
	}

	static sanitise(result, regex = false) {
		let cleaned = result
			.toString()
			.replace(process.env.DISCORD_TOKEN, '')
			.replace(/@(everyone|here)/g, '@\u200b$1');

		if (process.env.PGSTRING) {
			cleaned = cleaned.replace(process.env.PGSTRING, '');
		}

		return regex ? cleaned.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&') : cleaned;
	}

	static formatPerms(perms, mode = 'all') {
		if (perms instanceof Discord.Permissions) {
			return Object.entries(perms.serialize())
				.filter(perm =>
					mode === 'all' ? 1 : mode === 'has' ? perm[1] : !perm[1]
				)
				.map(perm =>
					Util.upperFirstChar(perm[0].replace(/_/g, ' ').toLowerCase())
				);
		}

		return perms.map(perm =>
			Util.upperFirstChar(perm.replace(/_/g, ' ').toLowerCase())
		);
	}

	static matchMessageURL(str, includeChannel = false) {
		let id;
		let url;

		try {
			url = new URL(str);
		} catch (err) {
			url = includeChannel ? undefined : (str.match(/^(\d+)$/) || [])[1];
		}

		if (!url) return undefined;

		if (url instanceof URL) {
			if (!url.pathname) return undefined;

			const [, channelID, messageID] =
				url.pathname.match(/\/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/) || [];
			if (!messageID) return undefined;

			if (includeChannel) {
				return {
					channelID,
					messageID,
				};
			}

			id = messageID;
		} else id = url;

		return id;
	}

	static matchMentions(mode, str) {
		const prefix =
			mode === 'u'
				? '@!'
				: mode === 'c'
				? '#'
				: mode === 'r'
				? '@&'
				: mode === 'e'
				? '\\w:'
				: null;

		if (
			typeof str !== 'string' ||
			!prefix ||
			new RegExp(`[^<>\\d\\s${prefix}]`).test(str)
		)
			return [];

		const matches = Array.from(
			str.matchAll(
				new RegExp(
					`(?<=(?:\\s+|^)<${
						mode === 'e' ? ':\\w+:' : prefix
					})\\d+(?=>(?:\\s+|$))|(?<=\\s+|^)\\d+(?=\\s+|$)`,
					'g'
				)
			)
		);

		return matches.map(arr => arr[0]);
	}

	static dayStart(timestamp = Date.now()) {
		return new Date(timestamp).setHours(0, 0, 0, 0).getTime();
	}

	static dayEnd(timestamp = Date.now()) {
		return new Date(timestamp).setHours(23, 59, 59, 999).getTime();
	}

	static padNumStart(num, length = 2) {
		return num.toString().padStart(length, 0);
	}

	static formatTime(t, mode = 'relative') {
		const time = {
			d: 0,
			h: 0,
			m: 0,
			s: 0,
			ms: 0,
		};

		time.d = Math.floor(t / 8.64e7);
		t %= 8.64e7;

		time.h = Math.floor(t / 3.6e6);
		t %= 3.6e6;

		time.m = Math.floor(t / 60000);
		t %= 60000;

		time.s = Math.floor(t / 1000);

		time.ms = t % 1000;

		if (mode === 'relative') {
			const largest = {
				type: 'ms',
				value: 0,
			};

			for (const [k, v] of Object.entries(time)) {
				if (v !== 0) {
					largest.type = k;
					largest.value = v;

					break;
				}
			}

			const largestIndex = TIMESCALE.indexOf(largest.type);
			const adjoining = {
				type: TIMESCALE[largestIndex + 1] || TIMESCALE[largestIndex - 1],
				value: time[TIMESCALE[largestIndex + 1] || TIMESCALE[largestIndex - 1]],
			};

			return TIMESCALE.indexOf(adjoining.type) < largestIndex
				? `${Util.padNumStart(adjoining.value)}${
						adjoining.type
				  }${Util.padNumStart(largest.value)}${largest.type}`
				: `${Util.padNumStart(largest.value)}${largest.type}${Util.padNumStart(
						adjoining.value
				  )}${adjoining.type}`;
		}

		return oneLine`
				${Util.padNumStart(time.d)}d
				${Util.padNumStart(time.h)}h
				${Util.padNumStart(time.m)}m
				${Util.padNumStart(time.s)}s
				${Util.padNumStart(time.ms)}ms
			`;
	}

	static nth(d) {
		if (d > 3 && d < 21) return 'th';
		switch (d % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	}

	static getReadableDate(t) {
		t = t instanceof Date ? t : new Date(t);
		const date = t.getDate();

		return `${date}${Util.nth(date)} ${
			MONTHS[t.getMonth()]
		} ${t.getFullYear()}`;
	}
}
