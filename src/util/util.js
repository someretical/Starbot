'use strict';

const { stripIndents } = require('common-tags');
const Discord = require('discord.js');

class Util {
	// Returns an 's' if the number is one
	static pluralize(number) {
		return number === 1 ? '' : 's';
	}

	// Returns string with first character capitalised
	static capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	// Replaces the last comma with an 'and' or ampersand
	static fancyJoin(string, ampersand = false) {
		if (string instanceof Array) string = string.join(', ');

		const n = string.lastIndexOf(',');

		string = string.slice(0, n) + string.slice(n).replace(',', ampersand ? ' &' : ' and');

		return string;
	}

	// Returns string ready to be sent
	static formatErrorDiscord(error, code) {
		return stripIndents`
			:( An error occurred has occurred for some reason.
			Please contact a dev and provide the error stack below:	
		`.concat(`\n\`\`\`js\nconst code = '${code}';\n${Util.sanitise(error.stack)}\n\`\`\``);
	}

	// Returns sanitised result
	// Regex option escapes all regex characters
	static sanitise(result, regex = false) {
		let cleansed = result.toString()
			.replace(process.env.TOKEN, 'here is the token you retard')
			.replace(/@(everyone|here)/g, '@\u200b$1');

		if (process.env.USER_DIRECTORY) {
			cleansed = cleansed.replace(new RegExp(process.env.USER_DIRECTORY, 'ig'), 'USER_DIRECTORY');
		}

		return !regex ? cleansed : cleansed.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
	}

	// Mode options: all, has, missing
	// Returns array of prettified permission flags
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
}

module.exports = Util;
