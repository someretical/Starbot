'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const Guild = require('./Guild.js');
const User = require('./User.js');

class Star extends Model {
	static get q() {
		return queue;
	}
}

Star.init({
	message_id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	author_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	channel_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	botMessage_id: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	reactions: {
		type: DataTypes.JSON,
		defaultValue: {},
	},
}, { db });

Guild.hasMany(Star, { foreignKey: 'guild_id' });
User.hasMany(Star, { foreignKey: 'author_id' });
Star.belongsTo(User, { foreignKey: 'author_id' });
Star.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Star;
