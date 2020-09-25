'use strict';

const { DataTypes, Model } = require('sequelize');
const { db } = require('../structures/StarbotDatabase.js');
const queue = new (require('../structures/StarbotQueueManager.js'))();
const cache = new (require('discord.js').Collection)();
const Guild = require('./Guild.js');
const User = require('./User.js');

class Tag extends Model {
	static get q() {
		return queue;
	}

	static get cache() {
		return cache;
	}
}

Tag.init({
	id: {
		type: DataTypes.UUIDV4,
		primaryKey: true,
		defaultValue: DataTypes.UUIDV4,
		allowNull: false,
	},
	guild_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	response: {
		type: DataTypes.TEXT,
		allowNull: false,
	},
	lastContentUpdate: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
	},
	creator_id: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	uses: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
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
					return !Tag.cache.has(instance.id) ? Tag.cache.set(instance.id, instance) : undefined;
				});
			} else if (!Tag.cache.has(val.id)) {
				val.isNewRecord = false;
				Tag.cache.set(val.id, val);
			}
		},

		// Emitted on model instances that are destroyed
		afterDestroy: instance => Tag.cache.delete(instance.id),

		// Emitted on model classes with destroy() called
		afterBulkDestroy: options => {
			const entries = Object.entries(options.where);
			cache.sweep(model => entries.every(([k, v]) => model[k] === v));
		},

		// Emitted on model instances that have save() or update() called on them
		afterSave: instance => {
			instance.isNewRecord = false;
			Tag.cache.set(instance.id, instance);
		},

		// Bandage fix for https://github.com/sequelize/sequelize/issues/10823
		beforeUpsert: values => {
			values.id = DataTypes.UUIDV4;
		},

		// Emitted on model class method upsert()
		afterUpsert: ([instance]) => {
			instance.isNewRecord = false;
			Tag.cache.set(instance.id, instance);
		},
	},
	sequelize: db,
});

Guild.hasMany(Tag, { foreignKey: 'guild_id' });
User.hasMany(Tag, { foreignKey: 'creator_id' });
Tag.belongsTo(User, { foreignKey: 'creator_id' });
Tag.belongsTo(Guild, { foreignKey: 'guild_id' });

module.exports = Tag;
