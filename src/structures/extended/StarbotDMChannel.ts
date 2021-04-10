import Discord from 'discord.js';

export default Discord.Structures.extend(
	'DMChannel',
	DMChannel =>
		class StarbotDMChannel extends DMChannel {
			constructor(...args) {
				super(...args);

				this.awaiting = new Set();
			}

			embed(str) {
				return this.send(this.client.embed(str));
			}
		}
);
