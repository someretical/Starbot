'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const cache = new (require('discord.js').Collection)();
const Guild = require('./Guild.js');
const User = require('./User.js');

class Star extends Model {
	static get q() {
		return queue;
	}

	static get cache() {
		return cache;
	}
}

Star.init({
	message_id: {
		type: DataTypes.STRING,
		primaryKey: true,
		allowNull: false,
	},
	author_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	channel_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	botMessage_id: {
		type: DataTypes.STRING,
		defaultValue: null,
	},
	reactions: {
		type: DataTypes.JSON,
		defaultValue: {},
	},
}, {
	hooks: {
		// Emitted on model class methods with find keyword
		afterFind: val => {
			if (!val) return;

			if (Array.isArray(val)) {
				if (!val.length) return;

				val.map(instance => {
					instance.isNewRecord = false;
					return !Star.cache.has(instance.message_id) ? Star.cache.set(instance.message_id, instance) : undefined;
				});
			} else if (!Star.cache.has(val.message_id)) {
				val.isNewRecord = false;
				Star.cache.set(val.message_id, val);
			}
		},

		// Emitted on model instances that are destroyed
		afterDestroy: instance => Star.cache.delete(instance.message_id),

		// Emitted on model classes with destroy() called
		afterBulkDestroy: options => {
			const entries = Object.entries(options.where);
			cache.sweep(model => entries.every(([k, v]) => model[k] === v));
		},

		// Emitted on model instances that have save() or update() called on them
		afterSave: instance => {
			instance.isNewRecord = false;
			return Star.cache.set(instance.message_id, instance);
		},

		// Emitted on model class method upsert()
		afterUpsert: ([instance]) => {
			instance.isNewRecord = false;
			return Star.cache.set(instance.message_id, instance);
		},
	},
	sequelize: db,
});

Guild.hasMany(Star, { foreignKey: 'guild_id' });
User.hasMany(Star, { foreignKey: 'author_id' });
Star.belongsTo(User, { foreignKey: 'author_id' });
Star.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Star;
