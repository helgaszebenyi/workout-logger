import { UnauthorizedError } from '../errors.js';

// Creates middleware that requires a valid Firebase ID token in the
// Authorization header ("Bearer <token>"). On success, the user's id is
// available as req.user.uid. The user id only ever comes from the verified
// token, never from the request body.
//
// verifyToken is passed in rather than imported, so tests can use a fake one.
export function createRequireAuth(verifyToken) {
  return async function requireAuth(req, res, next) {
    const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new UnauthorizedError());
    }
    try {
      const decoded = await verifyToken(token);
      req.user = { uid: decoded.uid, email: decoded.email };
      next();
    } catch {
      // Don't reveal why verification failed (expired, forged, ...).
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}