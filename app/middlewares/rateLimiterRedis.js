const redis = require('redis');
const {RateLimiterRedis} = require('rate-limiter-flexible');

const redisClient = redis.createClient({
  host: 'redis',
  port: 6379, // le port de REDIS
  enable_offline_queue: false,
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10, // 10 requêtes 
  duration: 1, // par seconde sur une IP
});

const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send('Va falloir réduire la cadence ...');
    });
};

module.exports = rateLimiterMiddleware;