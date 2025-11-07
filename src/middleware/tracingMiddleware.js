const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();
const { v4: uuidv4 } = require('uuid');

function tracingMiddleware(req, res, next) {
  const traceId = uuidv4();
  req.traceId = traceId;
  asyncLocalStorage.run(new Map([['traceId', traceId]]), () => {
    res.setHeader('X-Trace-Id', traceId);
    console.log(`[${traceId}] Reached server`);
    next();
  });
}

module.exports = { tracingMiddleware, asyncLocalStorage };
