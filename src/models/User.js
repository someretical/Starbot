'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();

class User extends Model {
	static get q() {
		return queue;
	}
}

User.init({
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	coins: {
		type: DataTypes.INTEGER,
		defaultValue: 100,
	},
	reputation: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
	throttles: {
		type: DataTypes.JSON,
		defaultValue: {},
	},
}, { db });

module.exports = User;
