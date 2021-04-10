'use strict';

const Discord = require('discord.js');
const yargsParser = require('yargs-parser');
const { sanitise } = require('../../util/Util.js');

module.exports = Discord.Structures.extend(
	'Message',
	Message => class StarbotMessage extends Message {
		constructor(...args) {
			super(...args);

			this.command = undefined;
			this.args = {
				raw:       undefined,
				processed: {},
			};
		}

		parseContent() {
			const _prefix = sanitise(this.guild ? this.guild.data.prefix : this.client.prefix);
			const [ , prefix, rawCommand ] = this.content.match(new RegExp(`^(<@!?${this.client.user.id}>\\s+|${_prefix})(\\S+)`)) || [];

			if (!prefix || !rawCommand) return undefined;

			const sanitisedCommand = sanitise(rawCommand);
			const _command = this.client.commands.get(this.client.aliases.get(sanitisedCommand) || sanitisedCommand);

			this.command = _command || sanitisedCommand;

			this.args.raw = this.content.slice(prefix.length + rawCommand.length).trim();
			this.args.processed = yargsParser(
				this.args.raw,
				{
					configuration: {
						'short-option-groups':       false,
						'camel-case-expansion':      false,
						'dot-notation':              false,
						'parse-numbers':             false,
						'boolean-negation':          false,
						'duplicate-arguments-array': false,
						'greedy-arrays':             false,
					},
				},
			);

			return undefined;
		}
	},
);
