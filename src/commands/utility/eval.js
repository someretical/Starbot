'use strict';

const { inspect } = require('util');
const tags = require('common-tags');
const Discord = require('discord.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const Util = require('../../util/Util.js');

module.exports = class Eval extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'eval',
			description: 'evaluate Javascript',
			group: 'utility',
			usage: '<expression>',
			args: [{
				name: '<expression>',
				optional: true,
				description: 'has to be code',
				example: 'console.log(\'hello world!\');',
				code: true,
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: true,
			throttle: 5000,
		});

		this.lastResult = null;
	}

	run(message) {
		// eslint-disable-next-line no-unused-vars
		const { client, raw, channel } = message;

		let hrDiff;
		try {
			const hrStart = process.hrtime();

			this.lastResult = eval(raw.args);

			hrDiff = process.hrtime(hrStart);
		} catch (err) {
			return channel.embed(`Error while evaluating: \`${err}\``);
		}

		this.hrStart = process.hrtime();

		const result = this.makeResultMessages(this.lastResult, hrDiff, raw.args);
		if (Array.isArray(result)) {
			return result.map(item => channel.send(item));
		} else {
			return channel.send(result);
		}
	}

	makeResultMessages(result, hrDiff, input = null) {
		const inspected = Util.sanitise(inspect(result, { depth: 0 })
			.replace(/!!NL!!/g, '\n'));
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== '\'' ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== '\'' ?
			split[split.length - 1] :
			inspected[last];
		const prepend = `\`\`\`js\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;

		if (input) {
			return Discord.splitMessage(tags.stripIndents`
				*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
		} else {
			return Discord.splitMessage(tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`, { maxLength: 1900, prepend, append });
		}
	}
};
