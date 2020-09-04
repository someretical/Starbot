'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const cache = new (require('discord.js').Collection)();

class User extends Model {
	static get q() {
		return queue;
	}

	static get cache() {
		return cache;
	}
}

User.init({
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	coins: {
		type: DataTypes.INTEGER,
		defaultValue: 100,
	},
	reputation: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
	throttles: {
		type: DataTypes.JSON,
		defaultValue: {},
	},
}, {
	hooks: {
		// Emitted on model class methods with find keyword
		afterFind: val => {
			if (!val) return;

			if (Array.isArray(val) && val.length) {
				val.map(instance =>
					!User.cache.has(instance.id) ? User.cache.set(instance.id, instance) : undefined,
				);
			} else if (!User.cache.has(val.id)) {
				User.cache.set(val.id, val);
			}
		},

		// Emitted on model instances that are destroyed
		// Model classes require custom handling for destructive actions such as destroy() and bulkDelete()
		afterDestroy: instance => User.cache.delete(instance.id),

		// Emitted on model instances that have save() or update() called on them
		afterSave: instance => User.cache.set(instance.id, instance),

		// Emitted on model class method upsert()
		afterUpsert: ([instance]) => User.cache.set(instance.id, instance),
	},
	sequelize: db,
});

module.exports = User;
