'use strict';

const { DataTypes } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');

const User = db.define(
	'User',
	{
		id: {
			type:       DataTypes.STRING,
			primaryKey: true,
			allowNull:  false,
		},
		coins: {
			type:         DataTypes.INTEGER,
			defaultValue: 100,
		},
		reputation: {
			type:         DataTypes.INTEGER,
			defaultValue: 0,
		},
		throttles: {
			type:         DataTypes.JSON,
			defaultValue: {},
		},
		blocked: {
			type:         DataTypes.JSON,
			defaultValue: {
				executor: null,
				reason:   null,
			},
		},
	},
);

module.exports = User;
