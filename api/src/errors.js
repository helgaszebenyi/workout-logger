// Custom error hierarchy. Every error the API throws on purpose extends
// AppError and carries its own HTTP status code, so one central error handler
// can turn any of them into a consistent JSON response.
export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name; // e.g. "NotFoundError" in logs
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 400: the request data is wrong. `problems` lists everything that's wrong.
export class ValidationError extends AppError {
  constructor(problems) {
    super('Request validation failed', 400, 'VALIDATION_ERROR', problems);
  }
}

// 401: no valid sign-in token.
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// 404: the thing asked for doesn't exist (or belongs to someone else).
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}