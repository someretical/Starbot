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
	Tag_id: {
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

			if (Array.isArray(val) && val.length) {
				val.map(instance => !Tag.cache.has(instance.id) ? Tag.cache.set(instance.id, instance) : undefined);
			} else if (!Tag.cache.has(val.id)) {
				Tag.cache.set(val.id, val);
			}
		},

		// Emitted on model instances that are destroyed
		// Model classes require custom handling for destructive actions such as destroy() and bulkDelete()
		afterDestroy: instance => Tag.cache.delete(instance.id),

		// Emitted on model instances that have save() or update() called on them
		afterSave: instance => Tag.cache.set(instance.id, instance),

		// Bandage fix for https://github.com/sequelize/sequelize/issues/10823
		beforeUpsert: values => {
			values.id = DataTypes.UUIDV4;
		},

		// Emitted on model class method upsert()
		afterUpsert: ([instance]) => Tag.cache.set(instance.id, instance),
	},
	sequelize: db,
});

Guild.hasMany(Tag, { foreignKey: 'Tag_id' });
User.hasMany(Tag, { foreignKey: 'creator_id' });
Tag.belongsTo(User, { foreignKey: 'creator_id' });
Tag.belongsTo(Guild, { foreignKey: 'Tag_id' });

module.exports = Tag;
