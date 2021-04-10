'use strict';

const path = require('path');
const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { formatPerms, upperFirstChar } = require('../../util/Util.js');

module.exports = class Help extends StarbotCommand {
	constructor(client) {
		super(
			client,
			{
				__dirname,
				name:        'help',
				aliases:     [],
				description: 'help for commands',
				usage:       '<prefix><command> [COMMAND]',
				args:        {
					optional: [
						{
							name:        'COMMAND',
							description: 'The name of a command',
							example:     'ping',
						},
					],
				},
				guildOnly: true,
				ownerOnly: false,
				throttle:  {
					duration:   5000,
					persistent: false,
				},
			},
		);
	}

	run(message) {
		const { args, author, channel, client, guild } = message;

		// Properly deal with undefined/null
		const commandName = String(args.processed._[0] || '');

		if (!commandName) {
			const embed = client
				.embed({ author: true })
				.setTitle('List of commands');

			for (const dir of client.commandGroups) {
				const group = path.basename(dir);
				if (!client.isOwner(author.id) && group === 'hidden') continue;

				embed.addField(
					upperFirstChar(group),
					client.commands
						.filter(cmd => cmd.group === group)
						.map(cmd => `\`${cmd.name}\``)
						.join(' ')
					|| '\u200b',
				);
			}

			return channel.send(embed);
		}

		const command = client.commands.get(client.aliases.get(commandName) || commandName);

		if (!command) return channel.embed(`No command with name \`${commandName}\` was found.`);

		const embed = client.embed({ author: true })
			.setTitle(`Details for '${command.name}' command`)
			.setDescription(stripIndents`
				• Description: ${command.description}
				• Group: ${command.group}
				• Usage: \`${guild.data.prefix}${command.name} ${command.usage}\`
				• Aliases: ${command.aliases.map(a => `\`${a}\``).join(', ') || 'no aliases'}
				• Special user permissions: ${formatPerms(command._permissions.user).join(', ') || 'none'}
				• Special bot permissions: ${formatPerms(command._permissions.client).join(', ') || 'none'}

				${command.guildOnly || command.ownerOnly ? '**Additional requirements**' : ''}${command.ownerOnly ? '\n• This command can only be used by the bot owner' : ''}${command.guildOnly ? '\n• This command can only be used in a server' : ''}
			`);

		const getEmptyEmbedCount = num => num < 3 ? 3 - num : num % 3;

		const replaceHolders = str => str.replace(
			/<id>/ig,
			client.user.id,
		);
		// More placeholders may be added in the future

		if (command.args.required.length) {
			embed.addField(
				`Required arguments (${command.args.required.length})`,
				'\u200b',
			);

			for (const arg of command.args.required) {
				embed.addField(
					arg.name,
					stripIndents`
						${arg.description}
						
						Example: \`${replaceHolders(arg.example)}\`
					`,
					true,
				);
			}

			for (let i = 0; i < getEmptyEmbedCount(command.args.required.length); i++) {
				embed.addField(
					'\u200b',
					'\u200b',
					true,
				);
			}
		}

		if (command.args.optional.length) {
			embed.addField(
				`Options (${command.args.optional.length})`,
				'\u200b',
			);

			for (const arg of command.args.optional) {
				embed.addField(
					arg.name,
					stripIndents`
						${arg.description}
						
						Example: \`${replaceHolders(arg.example)}\`
					`,
					true,
				);
			}

			for (let i = 0; i < getEmptyEmbedCount(command.args.optional.length); i++) {
				embed.addField(
					'\u200b',
					'\u200b',
					true,
				);
			}
		}

		return channel.send(embed);
	}
};
