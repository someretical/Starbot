'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();

class Guild extends Model {
	static get q() {
		return queue;
	}
}

Guild.init({
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	prefix: {
		type: DataTypes.STRING,
		defaultValue: process.env.PREFIX,
	},
	starboard_id: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	starboardEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	reactionThreshold: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
	},
	tagsEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	ignoredUsers: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
	ignoredRoles: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
	ignoredChannels: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
}, { db });

module.exports = Guild;
