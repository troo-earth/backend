function globalRouteLogger(req, res, next) {
  const traceId = req.traceId || 'no-trace-id';
  const routeStart = Date.now(); // or process.hrtime.bigint() for nanoseconds
  console.log(`[${traceId}] Entering ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const ms = Date.now() - routeStart;
    console.log(`[${traceId}] Exiting ${req.method} ${req.originalUrl} [${ms}ms]`);
  });

  next();
}

module.exports = globalRouteLogger;
