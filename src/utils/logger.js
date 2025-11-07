const { asyncLocalStorage } = require('../middleware/tracingMiddleware');

function getTraceId() {
  const store = asyncLocalStorage.getStore();
  return store ? store.get('traceId') : 'no-trace-id';
}

// Define logInfo and logError functions:
function logInfo(message) {
  console.log(`[${getTraceId()}] ${message}`);
}

function logError(message) {
  console.error(`[${getTraceId()}] ${message}`);
}

// The logging wrapper:
function withLogging(fn, name) {
  return async function(...args) {
    const start = Date.now();
    logInfo(`Entering ${name}`);
    try {
      const result = await fn.apply(this, args);
      const ms = Date.now() - start;
      logInfo(`Exiting ${name} [${ms}ms]`);
      return result;
    } catch (err) {
      const ms = Date.now() - start;
      logError(`Error in ${name}: ${err.message} [${ms}ms]`);
      throw err;
    }
  };
}


module.exports = { getTraceId, logInfo, logError, withLogging };
