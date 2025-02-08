/**
 * Wraps an async function and catches any errors, passing them to the next middleware
 * This eliminates the need for try/catch blocks in async route handlers
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 