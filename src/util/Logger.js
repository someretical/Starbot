'use strict';

const chalk = require('chalk');
const moment = require('moment');
const { inspect } = require('util');

class Logger {
	static log(...args) {
		args.map(arg => Logger.write(inspect(arg).toString(), chalk.bgWhite.black('[DEBUG]')));
	}

	static info(message) {
		Logger.write(message, chalk.bgGreen('[INFO]'));
	}

	static warn(message) {
		Logger.write(message, chalk.bgYellow('[WARN]'));
	}

	static err(message) {
		Logger.write(message, chalk.bgRed('[ERROR]'), true);
	}

	static stack(err) {
		Logger.write(err, chalk.bgRed('[STACK]'), true);
	}

	static write(content, type, error = false) {
		const lines = content.split(/\r?\n/g);
		const timeNow = `<${moment().format('HH:mm')}>`;
		lines.map(line =>
			line.length ?
				(error ? process.stderr : process.stdout).write(`${timeNow} ${type} ${line}\r\n`) :
				undefined,
		);
	}
}

module.exports = Logger;
