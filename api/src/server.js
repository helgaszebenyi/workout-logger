import express from 'express';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

const app = express();

const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Each user's workouts in their own subcollection 
// users/{userId}/workouts/{workoutId}
const workoutsCollection = (userId) =>
  db.collection('users').doc(userId).collection('workouts');

async function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch {
    // Don't reveal why verification failed (expired, forged, ...).
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', requireAuth);

// List all workouts - most recently created first
app.get('/api/workouts', async (req, res) => {
  const snapshot = await workoutsCollection(req.user.uid).orderBy('createdAt', 'desc').get();
  const workouts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ workouts });
});

// Get one workout by id 
app.get('/api/workouts/:id', async (req, res) => {
  const doc = await workoutsCollection(req.user.uid).doc(req.params.id).get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  res.json({ workout: { id: doc.id, ...doc.data() } });
});

// Create a workout 
app.post('/api/workouts', async (req, res) => {
  const { title, date, exercises } = req.body;
  const data = { title, date, exercises, createdAt: new Date().toISOString() };
  const ref = await workoutsCollection(req.user.uid).add(data);
  res.status(201).json({ workout: { id: ref.id, ...data } });
});

// Replace a workout's content, keeps its id and original creation time
app.put('/api/workouts/:id', async (req, res) => {
  const ref = workoutsCollection(req.user.uid).doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  const { title, date, exercises } = req.body;
  const data = {
    title,
    date,
    exercises,
    createdAt: doc.data().createdAt,
    updatedAt: new Date().toISOString(),
  };
  await ref.set(data);
  res.json({ workout: { id: ref.id, ...data } });
});

// Delete workout by id
app.delete('/api/workouts/:id', async (req, res) => {
  const ref = workoutsCollection(req.user.uid).doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  await ref.delete();
  res.status(204).end();
});

const server = app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

// Keep idle connections open longer than typical load balancers do (AWS: 60s).
// Otherwise a client or load balancer may reuse a connection the server just
// closed, and the request fails with ECONNRESET (or a 502 from a load balancer).
server.keepAliveTimeout = 65_000;
// Must be higher than keepAliveTimeout, or Node can still close connections early.
server.headersTimeout = 66_000;