export default class StarbotTagManager {
	constructor(guild) {
		this.client = guild.client;
		this.guild = guild;
		this.locked = new Set();
	}

	locked(name) {
		this.locked.has(name);
	}

	lock(name) {
		this.locked.add(name);
	}

	unlock(name) {
		this.locked.delete(name);
	}

	get(name) {
		return this.client.db.models.Tag.findOne({
			where: {
				guildID: this.guild.id,
				name,
			},
		});
	}

	async runBeforeHooks(message) {
		const hooks = [
			this.client.hooks.get('checkMessageCollectors'),
			this.client.hooks.get('checkBlockedChannels'),
			this.client.hooks.get('checkBlockedRoles'),
			this.client.hooks.get('checkBlockedUsers'),
		];

		for (const hook of hooks) {
			// eslint-disable-next-line no-await-in-loop
			const status = await hook.call(this, message);

			if (status === true) return true;
		}

		return false;
	}

	async getSendUpdate(message) {
		const tag = await this.get(message.command);
		if (!tag || (await this.runBeforeHooks(message))) return;

		const response = tag.response
			.replace(/<guild>/gi, message.guild.name)
			.replace(/<channel>/gi, message.channel.toString())
			.replace(/<author>/gi, message.author.toString());

		await message.channel.send(
			response.length > 2000 ? `${response.substring(0, 1997)}...` : response
		);

		tag.increment('uses');
	}
}
