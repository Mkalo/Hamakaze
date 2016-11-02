const mongoose = require('mongoose');
const winston = require('winston');

mongoose.Promise = require('bluebird');

const Schema = mongoose.Schema;

module.exports = { Schema };

mongoose.connect('mongodb://localhost:27017/Hamakaze')
	.catch(() => winston.error('Unable to connect to Mongo Server!'));
