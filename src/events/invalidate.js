'use strict';

module.exports = async client => {
	try {
		await client.db.close();
		client.destroy();

		process.exit(0);
	} catch (err) {
		process.exit(1);
	}
};
