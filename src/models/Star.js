'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const Guild = require('./Guild.js');
const User = require('./User.js');

const Star = db.define('Star', {
	message_id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	author_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	channel_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	guild_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	botMessage_id: {
		type: Sequelize.STRING,
		defaultValue: null,
	},
	reactors: {
		type: Sequelize.TEXT,
		defaultValue: '[]',
	},
	cmdReactors: {
		type: Sequelize.TEXT,
		defaultValue: '[]',
	},
});

Guild.hasMany(Star, { foreignKey: 'guild_id' });
User.hasMany(Star, { foreignKey: 'author_id' });
Star.belongsTo(User, { foreignKey: 'author_id' });
Star.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Star;
