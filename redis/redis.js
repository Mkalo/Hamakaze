const redisClient = require('redis');
const winston = require('winston');

const redis = redisClient.createClient(); // eslint-disable-line no-unused-vars

redis.on('error', err => { winston.error(err); })
	.on('reconnecting', () => { winston.warn('Reconnecting...'); });

module.exports = { redis };
