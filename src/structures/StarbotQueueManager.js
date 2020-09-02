'use strict';

const Logger = require('../util/Logger.js');

class StarbotQueue {
	constructor() {
		this.list = [];
		this.isProcessing = false;
	}

	get length() {
		return this.list.length;
	}

	add(promiseFunction) {
		this.list.push(promiseFunction);

		if (!this.isProcessing) this.process();
	}

	async process() {
		this.isProcessing = true;

		const promiseFunction = this.list.shift();

		if (!promiseFunction) {
			this.isProcessing = false;
			return;
		}

		try {
			await promiseFunction();
		} catch (err) {
			Logger.err(err, 'Failed to execute queue promise function');
		}

		this.process();
	}
}


class StarbotQueueManager {
	constructor() {
		this.queues = new Map();
	}

	add(id, promiseFunction) {
		if (!this.queues.has(id)) this.queues.set(id, new StarbotQueue());

		return new Promise((resolve, reject) => {
			this.queues.get(id).add(async () => {
				try {
					const res = await promiseFunction();
					resolve(res);
				} catch (err) {
					reject(err);
				}
			});
		});
	}
}

module.exports = StarbotQueueManager;
