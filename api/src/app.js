import express from 'express';
import { createRequireAuth } from './middleware/requireAuth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createHealthRouter } from './routes/healthRoutes.js';
import { createWorkoutRouter } from './routes/workoutRoutes.js';

// Builds the Express app from the parts it's given (dependency injection).
// server.js passes the real Firebase-backed parts; tests will pass fakes.
// This file never starts a server and never connects to Firebase itself.
export function createApp({ workoutService, verifyToken }) {
  const app = express();

  // Parse JSON request bodies, so they're available as req.body.
  app.use(express.json());

  // Public routes first, then everything under /api requires a signed-in user.
  app.use(createHealthRouter());
  app.use('/api', createRequireAuth(verifyToken));
  app.use('/api/workouts', createWorkoutRouter(workoutService));

  // Must come last: unknown routes, then the central error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}