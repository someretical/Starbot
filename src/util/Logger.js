'use strict';

const moment = require('moment');
const { inspect } = require('util');

class Logger {
	static log(...args) {
		args.map(arg => Logger.write(inspect(arg).toString(), '\u001b[40m\u001b[37m[DEBUG]\u001b[0m'));
	}

	static info(message) {
		Logger.write(message, '\u001b[42m[INFO]\u001b[0m');
	}

	static warn(message) {
		Logger.write(message, '\u001b[43m[WARN]\u001b[0m');
	}

	static err(message) {
		Logger.write(message, '\u001b[41m[ERROR]\u001b[0m', true);
	}

	static stack(err) {
		Logger.write(err.stack, '\u001b[41m[STACK]\u001b[0m', true);
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
