'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const cache = new (require('discord.js').Collection)();

class Guild extends Model {
	static get q() {
		return queue;
	}

	static get cache() {
		return cache;
	}
}

Guild.init({
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	prefix: {
		type: DataTypes.STRING,
		defaultValue: process.env.PREFIX,
	},
	starboard_id: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	starboardEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	reactionThreshold: {
		type: DataTypes.INTEGER,
		defaultValue: 1,
	},
	tagsEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	ignoredUsers: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
	ignoredRoles: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
	ignoredChannels: {
		type: DataTypes.JSON,
		defaultValue: [],
	},
}, {
	hooks: {
		// Emitted on model class methods with find keyword
		afterFind: val => {
			if (!val) return;

			if (Array.isArray(val) && val.length) {
				val.map(instance => !Guild.cache.has(instance.id) ? Guild.cache.set(instance.id, instance) : undefined);
			} else if (!Guild.cache.has(val.id)) {
				Guild.cache.set(val.id, val);
			}
		},

		// Emitted on model instances that are destroyed
		// Model classes require custom handling for destructive actions such as destroy() and bulkDelete()
		afterDestroy: instance => Guild.cache.delete(instance.id),

		// Emitted on model instances that have save() or update() called on them
		afterSave: instance => Guild.cache.set(instance.id, instance),

		// Emitted on model class method upsert()
		afterUpsert: ([instance]) => Guild.cache.set(instance.id, instance),
	},
	sequelize: db,
});

module.exports = Guild;
