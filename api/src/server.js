// Entry point: connects to Firebase, wires the real parts together
// and starts the HTTP server.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createApp } from './app.js';
import { WorkoutService } from './services/WorkoutService.js';
import { FirestoreWorkoutRepository } from './repositories/FirestoreWorkoutRepository.js';

// Connect to Firebase using the service-account key that
// GOOGLE_APPLICATION_CREDENTIALS points to.
const firebaseApp = initializeApp({ credential: applicationDefault() });
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const app = createApp({
  workoutService: new WorkoutService(new FirestoreWorkoutRepository(db)),
  verifyToken: (token) => auth.verifyIdToken(token),
  // A cheap Firestore call: it fails fast if the database is unreachable
  // or the credentials are wrong.
  checkReady: async () => {
    await db.listCollections();
  },
});

// Port comes from the environment so Docker/Kubernetes can choose it.
const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

// Keep idle connections open longer than typical load balancers do (AWS: 60s).
// Otherwise a client or load balancer may reuse a connection the server just
// closed, and the request fails with ECONNRESET (or a 502 from a load balancer).
server.keepAliveTimeout = 65_000;
// Must be higher than keepAliveTimeout, or Node can still close connections early.
server.headersTimeout = 66_000;

// Graceful shutdown. Docker and Kubernetes send SIGTERM before stopping a
// container (on every deploy, for example). Stop accepting new connections,
// let the requests already running finish, then exit. If something hangs,
// force the exit after 10 seconds.
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));