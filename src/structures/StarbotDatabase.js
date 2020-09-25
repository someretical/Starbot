'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Logger = require('../util/Logger.js');

const sequelize = new Sequelize({
	host: process.env.HOST,
	port: process.env.PORT,
	username: process.env.USERNAME,
	password: process.env.PASSWORD,
	database: process.env.DATABASE,
	dialect: process.env.DIALECT,
	storage: process.env.STORAGE,
	logging: false,
});

class StarbotDatabase {
	static get db() {
		return sequelize;
	}

	static async loadModels() {
		const modelsPath = path.join(__dirname, '..', 'models');
		const files = fs.readdirSync(modelsPath);

		for (const file of files) {
			if (!file.endsWith('.js')) {
				Logger.warn(`Skipping model ${file}`);
				continue;
			}

			const force = process.argv.includes('--force') || process.argv.includes('-f');

			// eslint-disable-next-line no-await-in-loop
			await require(`${modelsPath}/${file}`).sync({ force });
		}
	}

	static async authenticate() {
		await sequelize.authenticate();
		Logger.info('Successfully authenticated with database');

		await this.loadModels();
		Logger.info('Successfully loaded models');
	}
}

module.exports = StarbotDatabase;
