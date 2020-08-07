'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');

const Guild = db.define('Guild', {
	id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	prefix: {
		type: Sequelize.STRING,
		defaultValue: process.env.PREFIX,
	},
	starboard_id: {
		type: Sequelize.STRING,
		allowNull: true,
		defaultValue: null,
	},
	starboardEnabled: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
	},
	reactionThreshold: {
		type: Sequelize.INTEGER,
		defaultValue: 1,
	},
	tagsEnabled: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
	ignoredChannels: {
		type: Sequelize.TEXT,
		defaultValue: '[]',
	},
});

module.exports = Guild;
