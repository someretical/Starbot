import fs from 'fs';
import Starbot from './src/structures/Starbot.js';
import { CLIENT_OPTIONS } from './src/util/Constants.js';

(async () => {
	const importPromises = [];
	for (const file of fs.readdirSync('./dist/src/structures/extended/'))
		importPromises.push(import(`./src/structures/extended/${file}`));

	await Promise.all(importPromises);

	new Starbot(CLIENT_OPTIONS).init();
})();
