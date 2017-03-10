import { Sequelize } from 'sequelize';
import * as winston from 'winston';

const { db } = require('../settings.json');

export default class Database {
	private _database: Sequelize;

	constructor() {
		this._database = new Sequelize(db, { logging: false });
	}

	get db(): Sequelize {
		return this._database;
	}

	public start(): void {
		this._database.authenticate()
			.then(() => winston.info('Connection has been established successfully.'))
			.then(() => this._database.sync())
			.then(() => winston.info('Syncing Database...'))
			.catch((err: Error) => winston.error(`Unable to connect to the database: ${err}`));
	}
}
