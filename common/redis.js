'use strict';

const Redis      = require('ioredis');
const config     = require('../config');
const logger     = require('./logger');

const client = new Redis(config.redis.port, config.redis.host);

client.on("error", function (err) {
    logger.error('redis client catch error:', err);
});

module.exports = client;
