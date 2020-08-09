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
				Logger.info(`Skipping model ${file}`);
				continue;
			}

			// eslint-disable-next-line no-await-in-loop
			await require(`${modelsPath}/${file}`).sync();
		}
	}

	static async authenticate() {
		try {
			await StarbotDatabase.db.authenticate();
			Logger.info('Successfully authenticated with database');

			try {
				await StarbotDatabase.loadModels();
				Logger.info('Successing loaded models');

				const force = process.argv.includes('--force') || process.argv.includes('-f');

				if (force) {
					await StarbotDatabase.db.sync({ force });
					Logger.info(`${force ? 'Forcibly s' : 'S'}ynced database`);
				}
			} catch (err) {
				Logger.err(err, 'Failed to load models');
				process.exit();
			}
		} catch (err) {
			Logger.err(err, 'Failed to authenticate with database');
			Logger.info('Attempting to connect again in 5 seconds...');

			setTimeout(StarbotDatabase.authenticate, 5000);
		}
	}
}

module.exports = StarbotDatabase;
