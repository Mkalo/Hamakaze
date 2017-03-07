import { Sequelize } from 'sequelize';
import * as winston from 'winston';

// tslint:disable-next-line:no-var-requires
const { db } = require('../settings.json');
const database: Sequelize = new Sequelize(db, { logging: false });

export default class Database {
	get db(): Sequelize {
		return database;
	}

	public start(): void {
		database.authenticate()
			.then(() => winston.info('Connection has been established successfully.'))
			.then(() => database.sync())
			.then(() => winston.info('Syncing Database...'))
			.catch((err: Error) => winston.error(`Unable to connect to the database: ${err}`));
	}
}
