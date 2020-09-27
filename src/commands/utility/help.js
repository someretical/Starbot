'use strict';

const { oneLine, stripIndents } = require('common-tags');
const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { capitaliseFirstLetter: cfl, fancyJoin, prettifyPermissions } = require('../../util/Util.js');

module.exports = class Help extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'help',
			description: 'view details for commands',
			group: 'utility',
			usage: '<command>',
			args: [{
				name: '<command>',
				optional: true,
				description: 'any command or alias name',
				defaultValue: 'none',
				example: 'help',
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, author, channel, guild } = message;
		const { commands, aliases } = message.client;
		const prefix = guild ? guild.model.prefix : client.prefix;

		if (!args.length) {
			const embed = client.embed(stripIndents`
				For more detailed help, run \`${prefix}help <command>\`
				To view help for arguments, run \`${prefix}help arguments\`
			`, true)
				.setTitle('List of commands');
			let sorted = Array.from(client.commandGroups.values()).sort();

			if (!client.isOwner(author.id)) sorted = sorted.filter(group => group !== 'hidden');

			sorted.map(group => {
				const cmds = commands.filter(cmd => cmd.group === group);

				return embed.addField(cfl(group), cmds.map(cmd => `\`${cmd.name}\``).sort().join(' '), false);
			});

			return channel.send(embed);
		}

		if (/^arguments?$/i.test(args[0])) {
			const embed = client.embed(stripIndents`
					• If you want to include spaces in your arguments, wrap your argument in **single** or **double** quotes.
					${oneLine`• If you want to repeat the same quote character **within** your argument, 
						use \`<single_quote>\` and \`<double_quote>\` respectively.`}
					${oneLine`• Alternatively, just use different quote characters inside of your argument.
						For example \`"A single quote ' inside of double quotes"\``}
				`, true)
				.setTitle('Advanced arguments');

			return channel.send(embed);
		}

		let command = aliases.get(args[0].toLowerCase()) ||
		commands.has(args[0].toLowerCase()) ? commands.get(args[0].toLowerCase()).name : undefined;

		if (!command) {
			return channel.send('No valid arguments were provided');
		}

		if (!(command instanceof StarbotCommand)) command = commands.get(command);

		const help = [
			`• Description: ${command.description.replace('<prefix>', prefix)}`,
			`• Aliases: ${!command.aliases.length ? 'none' : command.aliases.join(', ')}`,
			`• Usage: \`${prefix}${command.name}${command.usage ? ' ' : ''}${command.usage}\``,
			`• Cooldown: ${moment(command.throttleDuration).from(0, true)}`,
		];

		if (command.userPermissions.length > 0) {
			help.push(oneLine`
				• Required user permissions: ${fancyJoin(prettifyPermissions(command.userPermissions))}
			`);
		}

		if (command.clientPermissions.length > 0) {
			help.push(oneLine`
				• Required bot permissions: ${fancyJoin(prettifyPermissions(command.clientPermissions))}
			`);
		}

		if (command.guildOnly) help.push('• **This command can only be used in servers**');
		if (command.ownerOnly) help.push('• **This command can only be run by bot owners**');

		const embed = client.embed(help.join('\n'), true)
			.setTitle(`${cfl(command.group)} \\ ${command.name} command`);

		for (const argument of command.args) {
			embed.addField(argument.name, stripIndents`
				• Optional: ${argument.optional ? 'yes' : 'no'}
				• Description: ${argument.description.replace(/<prefix>/g, prefix)}${argument.defaultValue ? `\n${oneLine`
					• Default value: ${argument.defaultValue}
				`}` : ''}
				• Example: ${argument.code === false ? argument.example : `\`${argument.example}\``}
			`, true);
		}

		return channel.send(embed);
	}
};
