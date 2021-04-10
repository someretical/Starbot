'use strict';

exports.CLIENT_OPTIONS = {
	messageEditHistoryMaxSize: 1,
	ws:                        {
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

exports.EMBED_COLOUR = 'ORANGE';

exports.IMAGE_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
];

exports.PACKAGE = require('../../package.json');

exports.MONTHS = [
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

exports.PERMISSIONS = [
	'VIEW_CHANNEL',
	'SEND_MESSAGES',
	'EMBED_LINKS',
	'ATTACH_FILES',
	'READ_MESSAGE_HISTORY',
];

exports.PREFIX = '.';

exports.PRESENCE = {
	status:   'online',
	afk:      false,
	activity: {
		name: 'help',
		type: 'PLAYING',
	},
};

exports.RAW_EVENTS = [
	'MESSAGE_DELETE',
	'MESSAGE_REACTION_ADD',
	'MESSAGE_REACTION_REMOVE',
	'MESSAGE_REACTION_REMOVE_ALL',
	'MESSAGE_REACTION_REMOVE_EMOJI',
];

exports.RE = {
	YES:    /^y(?:es)?$/i,
	NO:     /^no?$/i,
	CANCEL: /^cancel$/i,
	SKIP:   /^skip$/i,
};

exports.STAR_EMOJI = '⭐';

exports.TIMESCALE = [
	'd',
	'h',
	'm',
	's',
	'ms',
];
