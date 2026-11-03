import express from 'express';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const app = express();

const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Temporary user 
const DEV_USER_ID = 'dev-user';
const workoutsCollection = () =>
  db.collection('users').doc(DEV_USER_ID).collection('workouts');

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// List all workouts - most recently created first
app.get('/api/workouts', async (req, res) => {
  const snapshot = await workoutsCollection().orderBy('createdAt', 'desc').get();
  const workouts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json({ workouts });
});

// Get one workout by id 
app.get('/api/workouts/:id', async (req, res) => {
  const doc = await workoutsCollection().doc(req.params.id).get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  res.json({ workout: { id: doc.id, ...doc.data() } });
});

// Create a workout 
app.post('/api/workouts', async (req, res) => {
  const { title, date, exercises } = req.body;
  const data = { title, date, exercises, createdAt: new Date().toISOString() };
  const ref = await workoutsCollection().add(data);
  res.status(201).json({ workout: { id: ref.id, ...data } });
});


// Delete workout by id
app.delete('/api/workouts/:id', async (req, res) => {
  const ref = workoutsCollection().doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  await ref.delete();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});