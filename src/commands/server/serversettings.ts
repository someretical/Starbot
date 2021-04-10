import { stripIndents } from 'common-tags';
import NodeEmoji from 'node-emoji';
import { STAR_EMOJI } from '../../util/Constants.js';
import StarbotCommand from '../../structures/StarbotCommand.js';
import Util from '../../util/Util.js';

export default class ServerSettings extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'serversettings',
			aliases: [],
			description: 'view/edit server settings',
			usage: '[OPTIONS]',
			args: {
				optional: [
					{
						name: '-p, --prefix',
						description:
							'1-10 character string to replace the default bot prefixes, spaces are supported',
						example: '-p "pls "',
					},
					{
						name: '--tags-enabled',
						description:
							'True/False value (1 and 0 respectively) to toggle the tags feature',
						example: '--tags-enabled 0',
					},
					{
						name: '--starboard-channel',
						description:
							'Text channel mention or ID, the bot will use this channel to post embeds',
						example: '--starboard-id <id>',
					},
					{
						name: '--starboard-enabled',
						description:
							'True/False value (1 and 0 respectively) to toggle the starboard feature',
						example: '--starboard-enabled true',
					},
					{
						name: '--starboard-threshold',
						description:
							'Positive integer representing number of reactions needed to make the bot post an embed',
						example: '--starboard-threshold 2',
					},
					{
						name: '--star-emoji',
						description:
							'A custom emoji to replace the default star emoji, can be animated',
						example: '--star-emoji 👍',
					},
				],
			},
			guildOnly: true,
			ownerOnly: false,
			throttle: {
				duration: 5000,
				persistent: false,
			},
		});
	}

	async run(message) {
		const { args, channel, client, guild } = message;

		const data = { starboard: {} };

		const prefix = args.processed.p || args.processed.prefix;
		if (prefix) {
			if (prefix.length > 10)
				return channel.embed('The prefix must be under 10 characters long');

			data.prefix = prefix;
		}

		const channelMention = args.processed['starboard-channel'];
		if (channelMention) {
			const id = Util.matchMentions('c', channelMention);

			if (!id.length)
				return channel.emebd(
					'Failed to extract ID from the `starboard-id` option'
				);

			if (!guild.channels.cache.has(id[0]))
				return channel.embed(`Failed to find channel with ID of \`${id[0]}\``);

			data.starboard.id = id[0];
		}

		const tags = args.processed['tags-enabled'];
		if (tags) {
			const enabled =
				tags === 'true' || parseInt(tags) === 1
					? true
					: tags === 'false' || parseInt(tags) === 0
					? false
					: null;

			if (enabled === null)
				return channel.embed(
					'Failed to extract boolean from the `tags-enabled` option'
				);

			data.tagsEnabled = enabled;
		}

		const stars = args.processed['starboard-enabled'];
		if (stars) {
			const enabled =
				stars === 'true' || parseInt(stars) === 1
					? true
					: stars === 'false' || parseInt(stars) === 0
					? false
					: null;

			if (enabled === null)
				return channel.embed(
					'Failed to extract boolean from the `starboard-enabled` option'
				);

			data.starboard.enabled = enabled;
		}

		const num = args.processed['starboard-threshold'];
		if (num) {
			const realNum = parseInt(num);

			if (Number.isNaN(realNum))
				return channel.embed(
					'Failed to extract number from the `starboard-threshold` option'
				);

			if (realNum < 1 || realNum > 2147483647)
				return channel.embed(
					'The starboard threshold must be an integer between 1 and 2,147,483,647'
				);

			data.starboard.threshold = realNum;
		}

		const emojiString = args.processed['starboard-emoji'];
		if (emojiString) {
			const emoji =
				NodeEmoji.find(emojiString) || Util.matchMentions('e', emojiString)[0];

			if (!emoji)
				return channel.embed(
					'Failed to extract emoji from the `starboard-emoji` option'
				);

			if (typeof emoji === 'string') {
				if (!guild.emojis.cache.has(emoji))
					return channel.embed(
						`Failed to find the custom emoji with ID of \`${emoji}\``
					);

				data.starboard.emoji = emoji;
			} else data.starboard.emoji = emoji.emoji;
		}

		// Don't want to send update request every time just to view
		if (Object.keys(data.starboard).length) {
			// Copy by reference is very janky
			const starboardData = JSON.parse(JSON.stringify(guild.data.starboard));
			const mergedStarboardData = {
				...starboardData,
				...JSON.parse(JSON.stringify(data.starboard)),
			};
			data.starboard = mergedStarboardData;
		} else delete data.starboard;

		await guild.data.update(data);

		const updated = Object.keys(data).length ? 'Updated settings' : 'Settings';
		const emoji = guild.data.starboard.emoji
			? /^\d+$/.test(guild.data.starboard.emoji)
				? guild.emojis.cache.get(guild.data.starboard.emoji)?.toString() ||
				  `unknown emoji (ID: \`${guild.data.starboard.emoji}\`)`
				: guild.data.starboard.emoji
			: STAR_EMOJI;

		return channel.send(
			client
				.embed({ author: true })
				.setTitle(`${updated} for ${guild.name}`)
				.setThumbnail(guild.iconURL())
				.addField('Prefix', `\`${guild.data.prefix}\``, true)
				.addField('Tags', guild.data.tagsEnabled ? 'Enabled' : 'Disabled', true)
				.addField(
					'Starboard',
					stripIndents`
					• Channel: ${
						guild.data.starboard.id
							? guild.channels.cache.get(guild.data.starboard.id) ||
							  `unknown channel (ID: \`${guild.data.starboard.id}\`)`
							: 'not set'
					}
					• Status: ${guild.data.starboard.enabled ? 'enabled' : 'disabled'}
					• Threshold: ${guild.data.starboard.threshold} reaction${Util.pluralise(
						guild.data.starboard.threshold
					)}
					• Emoji: ${emoji}
				`,
					true
				)
		);
	}
}
