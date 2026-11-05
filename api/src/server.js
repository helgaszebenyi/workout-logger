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

const repository = new FirestoreWorkoutRepository(getFirestore(firebaseApp));
const app = createApp({
  workoutService: new WorkoutService(repository),
  verifyToken: (token) => auth.verifyIdToken(token),
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