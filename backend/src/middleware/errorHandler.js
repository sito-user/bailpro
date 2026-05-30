const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  if (process.env.NODE_ENV !== 'test') {
    logger.error({ method: req.method, path: req.path, status, stack: err.stack }, message);
  }

  res.status(status).json({
    error: code,
    message,
  });
};

module.exports = errorHandler;
