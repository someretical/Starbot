'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const User = require('./User.js');

class OptOut extends Model {
	static get q() {
		return queue;
	}
}

OptOut.init({
	user_id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	executor_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	reason: {
		type: DataTypes.STRING,
		defaultValue: 'None',
	},
}, { db });

User.hasMany(OptOut, { foreignKey: 'user_id' });
User.hasMany(OptOut, { foreignKey: 'executor_id' });
OptOut.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
OptOut.belongsTo(User, { as: 'executor', foreignKey: 'executor_id' });

module.exports = OptOut;
