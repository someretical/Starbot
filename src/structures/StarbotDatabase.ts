import fs from 'fs';
import { Sequelize } from 'sequelize';
import Logger from '../util/Logger.js';
import Util from '../util/Util.js';

const sequelize = new Sequelize(
	process.env.DIALECT === 'sqlite'
		? {
				dialect: process.env.DIALECT,
				storage: process.env.STORAGE,
				logging: false,
		  }
		: {
				host: process.env.PGSTRING,
				timestamps: false,
		  }
);

export default class StarbotDatabase {
	static get db() {
		return sequelize;
	}

	static async loadModels() {
		const importPromises = [];
		let counter = 0;

		for (const file of fs.readdirSync('./dist/src/models/')) {
			if (!file.endsWith('.js')) {
				Logger.warn(`Skipping file ${file}`);
				continue;
			}

			importPromises.push(import(`../models/${file}`));
			counter++;
		}

		const imported = await Promise.all(importPromises);

		const modelPromises = [];
		for (const model of imported) {
			modelPromises.push(model.default.sync());
		}
		await Promise.all(modelPromises);

		Logger.info(`Loaded ${counter} model${Util.pluralise(counter)}`);
	}

	static async authenticate() {
		await sequelize.authenticate();
		Logger.info('Authenticated with database');

		StarbotDatabase.loadModels();
	}
}
