'use strict';

const { DataTypes } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');

const Star = db.define(
	'Star',
	{
		id: {
			type:       DataTypes.STRING,
			primaryKey: true,
			allowNull:  false,
		},
		authorID: {
			type:      DataTypes.STRING,
			allowNull: false,
		},
		channelID: {
			type:      DataTypes.STRING,
			allowNull: false,
		},
		guildID: {
			type:      DataTypes.STRING,
			allowNull: false,
		},
		embedID: {
			type:         DataTypes.STRING,
			defaultValue: null,
		},
		stars: {
			type:         DataTypes.JSON,
			defaultValue: [],
		},
	},
);

module.exports = Star;
