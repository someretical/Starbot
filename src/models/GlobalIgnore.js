'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const User = require('./User.js');

const GlobalIgnore = db.define('GlobalIgnore', {
	user_id: {
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

User.hasMany(GlobalIgnore, { foreignKey: 'user_id' });
User.hasMany(GlobalIgnore, { foreignKey: 'executor_id' });
GlobalIgnore.belongsTo(User, { as: 'globalUser', foreignKey: 'user_id' });
GlobalIgnore.belongsTo(User, { as: 'globalExecutor', foreignKey: 'executor_id' });

module.exports = GlobalIgnore;
