'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const Guild = require('./Guild.js');
const User = require('./User.js');

class Tag extends Model {
	static get q() {
		return queue;
	}
}

Tag.init({
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	response: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	lastContentUpdate: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
	},
	creator_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	uses: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
}, { db });

Guild.hasMany(Tag, { foreignKey: 'guild_id' });
User.hasMany(Tag, { foreignKey: 'creator_id' });
Tag.belongsTo(User, { foreignKey: 'creator_id' });
Tag.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Tag;
