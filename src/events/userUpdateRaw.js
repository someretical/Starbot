'use strict';

module.exports = async (client, user) => {
	const userObj = client.users.cache.get(user.id);
	if (!userObj) return null;

	await userObj.add();

	const { username, discriminator } = userObj.data;
	if (user.username === username && user.discriminator === discriminator) return null;

	return userObj.queue(() => client.db.models.User.upsert({
		id: user.id,
		username: user.username,
		discriminator: user.discriminator,
	}));
};
