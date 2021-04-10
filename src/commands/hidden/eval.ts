/* eslint-disable @typescript-eslint/no-unused-vars */
import util from 'util';
import tags from 'common-tags';
import Discord from 'discord.js';
import StarbotCommand from '../../structures/StarbotCommand.js';
import Util from '../../util/Util.js';

export default class Eval extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'eval',
			aliases: [],
			description: 'evaluate JS',
			usage: '[CODE]',
			args: {
				required: [
					{
						name: 'CODE',
						description: 'Code to be executed',
						example: "console.log('hello world');",
					},
				],
			},
			ownerOnly: true,
			throttle: {
				duration: -1,
				persistent: false,
			},
		});

		this.lastResult = null;
	}

	async run(message) {
		const {
			client,
			args,
			author,
			channel,
			guild,
			id,
			member,
			reactions,
		} = message;

		let hrDiff;
		try {
			const hrStart = process.hrtime();

			// eslint-disable-next-line no-eval
			this.lastResult = await eval(args.raw);

			hrDiff = process.hrtime(hrStart);
		} catch (err) {
			return channel.send(`\`\`\`js\n${err}\n\`\`\``);
		}

		this.hrStart = process.hrtime();

		const result = this.makeResultMessages(this.lastResult, hrDiff, args.raw);
		if (Array.isArray(result)) return result.map(item => channel.send(item));

		return channel.send(result);
	}

	makeResultMessages(result, hrDiff, input = null) {
		const inspected = Util.sanitise(
			util.inspect(result, { depth: 0 }).replace(/!!NL!!/g, '\n')
		);

		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart =
			inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'"
				? split[0]
				: inspected[0];
		const appendPart =
			inspected[last] !== '}' &&
			inspected[last] !== ']' &&
			inspected[last] !== "'"
				? split[split.length - 1]
				: inspected[last];
		const prepend = `\`\`\`js\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;

		if (input) {
			return Discord.splitMessage(
				tags.stripIndents`
				*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`js
				${inspected}
				\`\`\`
			`,
				{
					maxLength: 1900,
					prepend,
					append,
				}
			);
		}

		return Discord.splitMessage(
			tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${
				hrDiff[1] / 1000000
			}ms.*
				\`\`\`js
				${inspected}
				\`\`\`
			`,
			{
				maxLength: 1900,
				prepend,
				append,
			}
		);
	}
}
