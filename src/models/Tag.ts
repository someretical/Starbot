import Sequelize from 'sequelize';
import StarbotDatabase from '../structures/StarbotDatabase.js';

export default StarbotDatabase.db.define('Tag', {
	guildID: {
		primaryKey: true,
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	name: {
		primaryKey: true,
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	creatorID: {
		type: Sequelize.DataTypes.STRING,
		allowNull: false,
	},
	response: {
		type: Sequelize.DataTypes.CHAR(2000),
		allowNull: false,
	},
	uses: {
		type: Sequelize.DataTypes.INTEGER,
		defaultValue: 0,
	},
	lastContentUpdate: {
		type: Sequelize.DataTypes.DATE,
		defaultValue: Sequelize.DataTypes.NOW,
	},
});
