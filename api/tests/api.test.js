// Integration tests: the real Express app, exercised with real HTTP requests
// (via supertest), but with a fake token checker and in-memory storage.
// No network, no Firebase, no running server needed.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { WorkoutService } from '../src/services/WorkoutService.js';
import { InMemoryWorkoutRepository } from '../src/repositories/InMemoryWorkoutRepository.js';

// The fake token checker: "token-alice" is a valid token for user "alice";
// anything else is rejected, like an expired or forged token would be.
async function fakeVerifyToken(token) {
  if (!token.startsWith('token-')) throw new Error('invalid token');
  return { uid: token.slice('token-'.length) };
}

const as = (uid) => ({ Authorization: `Bearer token-${uid}` });

const validWorkout = {
  title: 'Pull day',
  date: '2026-11-05',
  exercises: [{ name: 'Deadlift', sets: [{ reps: 5, weightKg: 140 }] }],
};

describe('Workout API', () => {
  let app;

  beforeEach(() => {
    app = createApp({
      workoutService: new WorkoutService(new InMemoryWorkoutRepository()),
      verifyToken: fakeVerifyToken,
    });
  });

  it('GET /healthz works without a token', async () => {
    await request(app).get('/healthz').expect(200, { status: 'ok' });
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/workouts').expect(401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('rejects an invalid token', async () => {
    await request(app).get('/api/workouts').set('Authorization', 'Bearer forged').expect(401);
  });

  it('supports create, read, update and delete', async () => {
    const created = await request(app).post('/api/workouts').set(as('alice')).send(validWorkout).expect(201);
    const id = created.body.workout.id;

    await request(app).get(`/api/workouts/${id}`).set(as('alice')).expect(200);

    const updated = await request(app)
      .put(`/api/workouts/${id}`)
      .set(as('alice'))
      .send({ ...validWorkout, title: 'Heavy pull day' })
      .expect(200);
    assert.equal(updated.body.workout.title, 'Heavy pull day');

    await request(app).delete(`/api/workouts/${id}`).set(as('alice')).expect(204);
    await request(app).get(`/api/workouts/${id}`).set(as('alice')).expect(404);
  });

  it("hides one user's workouts from another", async () => {
    const created = await request(app).post('/api/workouts').set(as('alice')).send(validWorkout);

    await request(app).get(`/api/workouts/${created.body.workout.id}`).set(as('bob')).expect(404);
    const list = await request(app).get('/api/workouts').set(as('bob')).expect(200);
    assert.deepEqual(list.body.workouts, []);
  });

  it('returns 400 with every problem for invalid input', async () => {
    const res = await request(app).post('/api/workouts').set(as('alice')).send({ title: '' }).expect(400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.length >= 2);
  });

  it('returns 400 for broken JSON', async () => {
    const res = await request(app)
      .post('/api/workouts')
      .set(as('alice'))
      .set('Content-Type', 'application/json')
      .send('{ "title": "Push day", }')
      .expect(400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope').set(as('alice')).expect(404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });
});