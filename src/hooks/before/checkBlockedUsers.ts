export default async message => {
	let _global = false;
	let guild = false;

	await message.author.findCreateFind();

	if (message.client.isOwner(message.author.id)) return false;

	_global = message.author.data
		? message.author.data.blocked.executor
		: _global;

	if (message.guild)
		guild = message.guild.data.blocked.users.includes(message.author.id);

	return _global || guild;
};
