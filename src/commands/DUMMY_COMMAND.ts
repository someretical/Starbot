import StarbotCommand from '../../structures/StarbotCommand.js';

export default class DummyCommand extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: '',
			aliases: [],
			description: '',
			usage: [],
			guildOnly: false,
			ownerOnly: true,
			throttle: {
				duration: 5000,
				persistent: false,
			},
			permissions: {
				client: [],
				user: [],
			},
			hooks: {
				before: [],
				after: [],
			},
		});
	}

	run(message) {
		return message;
	}
}
