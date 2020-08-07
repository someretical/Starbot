'use strict';

const { db } = require('../structures/StarbotDatabase.js');
const Sequelize = require('sequelize');

const User = db.define('User', {
	id: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
	},
	username: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	discriminator: {
		type: Sequelize.CHAR(4),
		allowNull: false,
	},
	coins: {
		type: Sequelize.INTEGER,
		defaultValue: 100,
	},
	reputation: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
	},
});

module.exports = User;
