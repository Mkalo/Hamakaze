import * as bluebird from 'bluebird';
import * as redisClient from 'redis';
import * as winston from 'winston';

bluebird.promisifyAll(redisClient.RedisClient.prototype);
bluebird.promisifyAll(redisClient.Multi.prototype);

const redis: any = redisClient.createClient({ db: '1' });

export default class Redis {
	get db(): any {
		return redis;
	}

	public start(): void {
		redis.on('error', (err: Error) => winston.error(`${err}`))
			.on('reconnecting', () => winston.warn('Redis: Reconnecting...'));
	}
}
