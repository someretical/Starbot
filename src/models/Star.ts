import Sequelize from 'sequelize';
import StarbotDatabase from '../structures/StarbotDatabase.js';

export default StarbotDatabase.db.define('Star', {
	id: {
		type: Sequelize.DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	authorID: {
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	channelID: {
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	guildID: {
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	embedID: {
		type: Sequelize.DataTypes.STRING,
		defaultValue: null,
	},
	stars: {
		type: Sequelize.DataTypes.JSON,
		defaultValue: [],
	},
});
