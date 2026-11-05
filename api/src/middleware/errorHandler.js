import { AppError } from '../errors.js';

// Requests that matched no route get a JSON 404 instead of Express's HTML page.
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  });
}

// The central error handler: the one place where errors become HTTP responses.
// - AppErrors (thrown on purpose) are sent with their own status and message.
// - Broken JSON in a request body becomes a 400.
// - Anything else is a bug: it's logged in full on the server, but the client
//   only gets a generic 500, so internal details never leak.
// Express recognises error handlers by their four parameters, so `_next` must
// stay even though it's unused (the _ marks it as intentionally unused).
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}