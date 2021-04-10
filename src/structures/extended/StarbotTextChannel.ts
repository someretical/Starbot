import Discord from 'discord.js';

export default Discord.Structures.extend(
	'TextChannel',
	TextChannel =>
		class StarbotTextChannel extends TextChannel {
			constructor(...args) {
				super(...args);

				this.awaiting = new Set();
			}

			embed(str) {
				return this.send(this.client.embed(str));
			}
		}
);
