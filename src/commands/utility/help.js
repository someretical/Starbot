'use strict';

const { oneLine, stripIndents } = require('common-tags');
const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { capitaliseFirstLetter: cfl, fancyJoin, prettifyPermissions } = require('../../util/Util.js');

class Help extends StarbotCommand {
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
		const { client, channel, guild, args } = message;
		const { commands, aliases } = message.client;

		const prefix = guild ? guild.settings.prefix : client.prefix;

		if (!args.length) {
			const embed = client.embed(`For more detailed help, run \`${prefix}help <command>\``, true)
				.setTitle('List of commands');
			const groups = [];

			commands.forEach(cmd => {
				if (!groups.includes(cmd.group)) groups.push(cmd.group);
			});

			for (const group of groups.sort()) {
				const filtered = commands.filter(cmd => cmd.group === group);

				embed.addField(cfl(group), filtered.map(cmd => `\`${cmd.name}\``).sort().join(' '), false);
			}

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
		commands.has(args[0].toLowerCase()) ? commands.get(args[0].toLowerCase()).name : null;

		if (!command) {
			return channel.embed('No valid arguments were provided');
		}

		if (!(command instanceof StarbotCommand)) command = commands.get(command);

		const help = [
			`• Description: ${command.description}`,
			`• Aliases: ${!command.aliases.length ? 'none' : command.aliases.join(', ')}`,
			`• Usage: \`${prefix}${command.name}${command.usage ? ' ' : ''}${command.usage}\``,
			`• Cooldown: ${moment(command.throttleDuration).from(0, true)}`,
		];

		if (command.userPermissions.length) {
			help.push(oneLine`
				• Required permissions: ${fancyJoin(prettifyPermissions(command.userPermissions)) || 'none'}
			`);
		}

		if (command.guildOnly) help.push('• **This command can only be used in servers**');
		if (command.ownerOnly) help.push('• **This command can only be run by bot owners**');

		const embed = client.embed(help.join('\n'), true)
			.setTitle(`${cfl(command.group)} \\ ${command.name} command`);

		for (const argument of command.args) {
			embed.addField(argument.name, stripIndents`
				• Optional: ${argument.optional ? 'yes' : 'no'}
				• Description: ${argument.description.replace(/<prefix>/g, prefix)}
				• Example: \`${argument.example}\`
			`, true);
		}

		channel.send(embed);
	}
}

module.exports = Help;
