// Unit tests for the service, using the in-memory repository instead of Firestore.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WorkoutService } from '../src/services/WorkoutService.js';
import { InMemoryWorkoutRepository } from '../src/repositories/InMemoryWorkoutRepository.js';
import { WorkoutRepository } from '../src/repositories/WorkoutRepository.js';
import { NotFoundError, ValidationError } from '../src/errors.js';

const input = (overrides = {}) => ({
  title: 'Workout',
  date: '2026-11-05',
  exercises: [{ name: 'Squat', sets: [{ reps: 5, weightKg: 100 }] }],
  ...overrides,
});

describe('WorkoutService', () => {
  let service;

  // A new, empty service before every test, so tests can't affect each other.
  beforeEach(() => {
    service = new WorkoutService(new InMemoryWorkoutRepository());
  });

  it('creates a workout and finds it again', async () => {
    const created = await service.createWorkout('alice', input());
    const found = await service.getWorkout('alice', created.id);
    assert.equal(found.title, 'Workout');
    assert.ok(found.createdAt);
  });

  it("does not let one user read or delete another user's workout", async () => {
    const created = await service.createWorkout('alice', input());

    await assert.rejects(service.getWorkout('bob', created.id), NotFoundError);
    await assert.rejects(service.deleteWorkout('bob', created.id), NotFoundError);
    assert.deepEqual(await service.listWorkouts('bob'), []);
    assert.ok(await service.getWorkout('alice', created.id)); // still there
  });

  it('keeps the original createdAt when updating', async () => {
    const created = await service.createWorkout('alice', input());
    const updated = await service.updateWorkout('alice', created.id, input({ title: 'Renamed' }));

    assert.equal(updated.title, 'Renamed');
    assert.equal(updated.createdAt, created.createdAt);
    assert.ok(updated.updatedAt);
  });

  it('throws NotFoundError for a workout that does not exist', async () => {
    await assert.rejects(service.getWorkout('alice', 'nope'), NotFoundError);
    await assert.rejects(service.updateWorkout('alice', 'nope', input()), NotFoundError);
    await assert.rejects(service.deleteWorkout('alice', 'nope'), NotFoundError);
  });

  it('refuses invalid input and saves nothing', async () => {
    await assert.rejects(service.createWorkout('alice', input({ title: '' })), ValidationError);
    assert.deepEqual(await service.listWorkouts('alice'), []);
  });
});

describe('WorkoutRepository', () => {
  it('cannot be created directly, because it is abstract', () => {
    assert.throws(() => new WorkoutRepository(), TypeError);
  });
});