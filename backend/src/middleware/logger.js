function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '✅';
    console.log(
      `${statusColor} [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });
  next();
}

module.exports = { requestLogger };
