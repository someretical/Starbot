'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Logger = require('../util/Logger.js');

const sequelize = new Sequelize(process.env.DIALECT === 'sqlite' ? {
	dialect: process.env.DIALECT,
	storage: process.env.STORAGE,
	logging: false,
} : process.env.PGSTRING);

class StarbotDatabase {
	static get db() {
		return sequelize;
	}

	static async loadModels() {
		const force = process.argv.includes('--force') || process.argv.includes('-f');
		const modelsPath = path.join(__dirname, '..', 'models');
		const files = fs.readdirSync(modelsPath);

		await require(`${modelsPath}/Guild.js`).sync({ force });
		await require(`${modelsPath}/User.js`).sync({ force });

		for (const file of files.filter(f => !['Guild.js', 'User.js'].includes(f))) {
			if (!file.endsWith('.js')) {
				Logger.warn(`Skipping model ${file}`);
				continue;
			}

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
