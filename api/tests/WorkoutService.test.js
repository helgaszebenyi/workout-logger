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

describe('WorkoutService.getStats', () => {
  // A fixed "today", so "last 30 days" gives the same answer every time.
  const today = new Date('2026-11-05T12:00:00Z');
  let service;

  beforeEach(() => {
    service = new WorkoutService(new InMemoryWorkoutRepository(), { now: () => today });
  });

  it('returns zeros and no records for a new user', async () => {
    assert.deepEqual(await service.getStats('nobody'), {
      totalWorkouts: 0,
      workoutsLast30Days: 0,
      totalSets: 0,
      totalVolumeKg: 0,
      personalRecords: [],
    });
  });

  it('adds up totals and finds personal records', async () => {
    await service.createWorkout('alice', input({
      date: '2026-11-01',
      exercises: [
        { name: 'Bench press', sets: [{ reps: 5, weightKg: 80 }, { reps: 5, weightKg: 80 }] },
        { name: 'Plank', sets: [{ durationSec: 60 }] },
      ],
    }));
    await service.createWorkout('alice', input({
      date: '2026-11-04',
      exercises: [{ name: 'bench press', sets: [{ reps: 3, weightKg: 90 }] }],
    }));
    // More than 30 days ago: counts in the totals, not in "last 30 days".
    await service.createWorkout('alice', input({
      date: '2026-09-01',
      exercises: [{ name: 'Plank', sets: [{ durationSec: 90 }] }],
    }));
    // Another user's workout must not count.
    await service.createWorkout('bob', input());

    const stats = await service.getStats('alice');

    assert.equal(stats.totalWorkouts, 3);
    assert.equal(stats.workoutsLast30Days, 2);
    assert.equal(stats.totalSets, 5);
    assert.equal(stats.totalVolumeKg, 5 * 80 * 2 + 3 * 90);
    assert.deepEqual(stats.personalRecords, [
      { exercise: 'bench press', kind: 'weight', value: 90, date: '2026-11-04' },
      { exercise: 'Plank', kind: 'time', value: 90, date: '2026-09-01' },
    ]);
  });
});

describe('WorkoutRepository', () => {
  it('cannot be created directly, because it is abstract', () => {
    assert.throws(() => new WorkoutRepository(), TypeError);
  });
});
