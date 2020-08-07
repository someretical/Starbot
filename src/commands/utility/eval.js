'use strict';

const { inspect } = require('util');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { sanitise } = require('../../util/util.js');

class Eval extends StarbotCommand {
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
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: true,
			throttle: 5000,
		});
	}

	async run(message) {
		const { raw, channel } = message;

		try {
			const evaluated = await eval(raw.args);

			let result = sanitise(inspect(evaluated));

			if (!result.length) {
				channel.send(`\`\`\`js\nundefined\n\`\`\``);
				return;
			}

			result = result.match(/[\s\S]{1,1988}/g) || [];

			for (const part of result) channel.send(`\`\`\`js\n${part}\n\`\`\``);
		} catch (err) {
			channel.send(`\`\`\`js\n${sanitise(err.stack)}\n\`\`\``);
		}
	}
}

module.exports = Eval;
