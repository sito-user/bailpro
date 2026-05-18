// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${req.method}] ${req.path} - ${status} - ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: code,
    message,
  });
};

module.exports = errorHandler;
