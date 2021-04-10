import Sequelize from 'sequelize';
import StarbotDatabase from '../structures/StarbotDatabase.js';

export default StarbotDatabase.db.define('User', {
	id: {
		type: Sequelize.DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	coins: {
		type: Sequelize.DataTypes.INTEGER,
		defaultValue: 100,
	},
	reputation: {
		type: Sequelize.DataTypes.INTEGER,
		defaultValue: 0,
	},
	throttles: {
		type: Sequelize.DataTypes.JSON,
		defaultValue: {},
	},
	blocked: {
		type: Sequelize.DataTypes.JSON,
		defaultValue: {
			executor: null,
			reason: null,
		},
	},
});
