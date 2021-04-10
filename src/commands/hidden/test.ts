import StarbotCommand from '../../structures/StarbotCommand.js';

export default class Test extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'test',
			aliases: [],
			description: 'test',
			usage: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: {
				duration: -1,
				persistent: false,
			},
			permissions: {
				client: [],
				user: ['ADMINISTRATOR'],
			},
			hooks: {
				before: [
					message => {
						message.channel.awaiting.add(message.author.id);

						return false;
					},
				],
				after: [
					message => {
						message.channel.awaiting.delete(message.author.id);
					},
				],
			},
		});
	}

	run(message) {
		return message.channel.send(message.channel.awaiting.toString());
	}
}
