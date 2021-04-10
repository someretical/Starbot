export const CLIENT_OPTIONS = {
	messageEditHistoryMaxSize: 1,
	ws: {
		intents: [
			'GUILDS',
			'GUILD_EMOJIS',
			'GUILD_MESSAGES',
			'GUILD_MESSAGE_REACTIONS',
			'DIRECT_MESSAGES',
			'DIRECT_MESSAGE_REACTIONS',
		],
	},
};

export const EMBED_COLOUR = 'ORANGE';

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export const PACKAGE = import('../../package.json');

export const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

export const PERMISSIONS = [
	'VIEW_CHANNEL',
	'SEND_MESSAGES',
	'EMBED_LINKS',
	'ATTACH_FILES',
	'READ_MESSAGE_HISTORY',
];

export const PREFIX = '.';

export const PRESENCE = {
	status: 'online',
	afk: false,
	activity: {
		name: 'help',
		type: 'PLAYING',
	},
};

export const RAW_EVENTS = [
	'MESSAGE_DELETE',
	'MESSAGE_REACTION_ADD',
	'MESSAGE_REACTION_REMOVE',
	'MESSAGE_REACTION_REMOVE_ALL',
	'MESSAGE_REACTION_REMOVE_EMOJI',
];

export const RE = {
	YES: /^y(?:es)?$/i,
	NO: /^no?$/i,
	CANCEL: /^cancel$/i,
	SKIP: /^skip$/i,
};

export const STAR_EMOJI = '⭐';

export const TIMESCALE = ['d', 'h', 'm', 's', 'ms'];
