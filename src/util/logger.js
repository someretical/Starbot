'use strict';

const chalk = require('chalk');
const moment = require('moment');
const { inspect } = require('util');

class Logger {
	static log(...args) {
		for (let arg of args) {
			arg = inspect(arg).toString().trim();

			for (const line of arg.split(/\n/g)) {
				console.log(`<${moment().format('HH:mm')}> ${chalk.bgWhite.black('[DEBUG]')} ${line}`);
			}
		}
	}

	static info(message) {
		console.log(`<${moment().format('HH:mm')}> ${chalk.bgGreen('[INFO]')} ${message}`);
	}

	static warn(message, ...args) {
		console.log(`<${moment().format('HH:mm')}> ${chalk.bgYellow('[INFO]')} Error: ${message}`);

		for (let arg of args) {
			arg = arg.toString().trim();

			for (const line of arg.split(/\n/g)) {
				if (!line.test(/\S/)) continue;

				console.log(`<${moment().format('HH:mm')}> ${chalk.bgYellow('[WARN]')} ${line}`);
			}
		}
	}

	static err(error, message) {
		if (message) console.log(`<${moment().format('HH:mm')}> ${chalk.bgRed('[ERROR]')} Message: ${message}`);

		for (const line of error.stack.split(/\n/g)) {
			console.log(`<${moment().format('HH:mm')}> ${chalk.bgRed('[ERROR]')} ${line}`);
		}
	}
}

module.exports = Logger;
