import Sequelize from 'sequelize';
import { PREFIX } from '../util/Constants.js';
import StarbotDatabase from '../structures/StarbotDatabase.js';

export default StarbotDatabase.db.define('Guild', {
	id: {
		type: Sequelize.DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	prefix: {
		type: Sequelize.DataTypes.STRING,
		defaultValue: PREFIX,
	},
	starboard: {
		type: Sequelize.DataTypes.JSON,
		defaultValue: {
			id: null,
			enabled: false,
			threshold: 1,
			emoji: null,
		},
	},
	tagsEnabled: {
		type: Sequelize.DataTypes.BOOLEAN,
		defaultValue: false,
	},
	blocked: {
		type: Sequelize.DataTypes.JSON,
		defaultValue: {
			users: [],
			channels: [],
		},
	},
});
