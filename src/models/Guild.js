'use strict';

const { DataTypes } = require('sequelize');
const { PREFIX } = require('../util/Constants.js');
const { db } = require('../structures/StarbotDatabase.js');

const Guild = db.define(
	'Guild',
	{
		id: {
			type:       DataTypes.STRING,
			primaryKey: true,
			allowNull:  false,
		},
		prefix: {
			type:         DataTypes.STRING,
			defaultValue: PREFIX,
		},
		starboard: {
			type:         DataTypes.JSON,
			defaultValue: {
				id:        null,
				enabled:   false,
				threshold: 1,
				emoji:     null,
			},
		},
		tagsEnabled: {
			type:         DataTypes.BOOLEAN,
			defaultValue: false,
		},
		blocked: {
			type:         DataTypes.JSON,
			defaultValue: {
				users:    [],
				channels: [],
			},
		},
	},
);

module.exports = Guild;
