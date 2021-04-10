'use strict';

const fs = require('fs');
const Sequelize = require('sequelize');
const Logger = require('../util/Logger.js');
const { pluralise: s } = require('../util/Util.js');

const sequelize = new Sequelize(process.env.DIALECT === 'sqlite'
	? {
		dialect: process.env.DIALECT,
		storage: process.env.STORAGE,
		logging: false,
	}
	: {
		host:       process.env.PGSTRING,
		timestamps: false,
	});

class StarbotDatabase {
	static get db() {
		return sequelize;
	}

	static async loadModels() {
		const modelPromises = [];
		let counter = 0;

		for (const file of fs.readdirSync('./src/models/')) {
			if (!file.endsWith('.js')) {
				Logger.warn(`Skipping file ${file}`);
				continue;
			}

			modelPromises.push(require(`../models/${file}`).sync());
			counter++;
		}

		await Promise.all(modelPromises);

		Logger.info(`Loaded ${counter} model${s(counter)}`);
	}

	static async authenticate() {
		await sequelize.authenticate();
		Logger.info('Authenticated with database');

		StarbotDatabase.loadModels();
	}
}

module.exports = StarbotDatabase;
