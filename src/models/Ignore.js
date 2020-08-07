'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const Guild = require('./Guild.js');
const User = require('./User.js');

const Ignore = db.define('Ignore', {
	user_id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	guild_id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	executor_id: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	reason: {
		type: Sequelize.STRING,
		defaultValue: 'None',
	},
});

Guild.hasMany(Ignore, { foreignKey: 'guild_id' });
User.hasMany(Ignore, { foreignKey: 'user_id' });
User.hasMany(Ignore, { foreignKey: 'executor_id' });
Ignore.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Ignore.belongsTo(User, { as: 'executor', foreignKey: 'executor_id' });
Ignore.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Ignore;
