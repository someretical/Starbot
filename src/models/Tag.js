'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const Guild = require('./Guild.js');
const User = require('./User.js');

const Tag = db.define('Tag', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		allowNull: false,
	},
	guild_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	response: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	lastContentUpdate: {
		type: Sequelize.DATE,
		defaultValue: Sequelize.NOW,
	},
	creator_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	uses: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
});

Guild.hasMany(Tag, { foreignKey: 'guild_id' });
User.hasMany(Tag, { foreignKey: 'creator_id' });
Tag.belongsTo(User, { foreignKey: 'creator_id' });
Tag.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Tag;
