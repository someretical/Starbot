'use strict';

const { DataTypes } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');

const Tag = db.define(
	'Tag',
	{
		guildID: {
			primaryKey: true,
			type:       DataTypes.STRING,
			allowNull:  false,
		},
		name: {
			primaryKey: true,
			type:       DataTypes.STRING,
			allowNull:  false,
		},
		creatorID: {
			type:      DataTypes.STRING,
			allowNull: false,
		},
		response: {
			type:      DataTypes.CHAR(2000),
			allowNull: false,
		},
		uses: {
			type:         DataTypes.INTEGER,
			defaultValue: 0,
		},
		lastContentUpdate: {
			type:         DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
);

module.exports = Tag;
