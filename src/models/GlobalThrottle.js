'use strict';

const Sequelize = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const User = require('./User.js');

const GlobalThrottle = db.define('GlobalThrottle', {
	user_id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	command: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	endsAt: {
		type: Sequelize.DATE,
		allowNull: false,
	},
});

User.hasMany(GlobalThrottle, { foreignKey: 'user_id' });
GlobalThrottle.belongsTo(User, { foreignKey: 'user_id' });

module.exports = GlobalThrottle;
