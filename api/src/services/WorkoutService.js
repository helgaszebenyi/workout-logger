import { Workout } from '../models/Workout.js';
import { NotFoundError } from '../errors.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Personal records compare like with like; if an exercise was logged in
// different ways, weight beats time, and time beats reps.
const RECORD_RANK = { weight: 3, time: 2, reps: 1 };

// Business logic for workouts: what happens, independent of HTTP and storage.
//   routes -> WorkoutService -> repository
export class WorkoutService {
  // `now` returns the current time. It's a parameter so tests can use a fixed
  // date: "last 30 days" would otherwise give a different answer every day.
  constructor(repository, { now = () => new Date() } = {}) {
    this.repository = repository;
    this.now = now;
  }

  listWorkouts(userId) {
    return this.repository.findAllByUser(userId);
  }

  // Throws NotFoundError if the workout doesn't exist for this user.
  async getWorkout(userId, id) {
    const workout = await this.repository.findById(userId, id);
    if (!workout) throw new NotFoundError('Workout');
    return workout;
  }

  // Validates the input (throws ValidationError) and saves it.
  // async, like every other method, so callers always get a promise back,
  // even when validation fails.
  async createWorkout(userId, input) {
    const workout = Workout.fromInput(input);
    return this.repository.create(userId, {
      ...workout.toStorage(),
      createdAt: this.now().toISOString(),
    });
  }

  // Replaces a workout's content but keeps its original creation time.
  async updateWorkout(userId, id, input) {
    const workout = Workout.fromInput(input); // validate first: no database call needed if it's invalid
    const existing = await this.getWorkout(userId, id); // throws NotFoundError if missing
    return this.repository.update(userId, id, {
      ...workout.toStorage(),
      createdAt: existing.createdAt,
      updatedAt: this.now().toISOString(),
    });
  }

  async deleteWorkout(userId, id) {
    const deleted = await this.repository.delete(userId, id);
    if (!deleted) throw new NotFoundError('Workout');
  }

  // Summary numbers for the overview, plus each exercise's personal record.
  // Exercise names are compared case-insensitively ("Bench press" = "bench press").
  async getStats(userId) {
    const stored = await this.repository.findAllByUser(userId);
    const workouts = stored.map((data) => Workout.fromStored(data));
    const cutoff = new Date(this.now().getTime() - 30 * DAY_MS).toISOString().slice(0, 10);

    const records = new Map(); // lower-case name -> record
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const key = exercise.name.toLowerCase();
        const { kind, value } = exercise.best;
        const current = records.get(key);
        const isBetter = !current
          || RECORD_RANK[kind] > RECORD_RANK[current.kind]
          || (kind === current.kind && value > current.value);
        if (isBetter) {
          records.set(key, { exercise: exercise.name, kind, value, date: workout.date });
        }
      }
    }

    return {
      totalWorkouts: workouts.length,
      workoutsLast30Days: workouts.filter((workout) => workout.date >= cutoff).length,
      totalSets: sum(workouts.map((workout) => workout.totalSets)),
      totalVolumeKg: sum(workouts.map((workout) => workout.totalVolumeKg)),
      personalRecords: [...records.values()].sort((a, b) => a.exercise.localeCompare(b.exercise)),
    };
  }
}

function sum(numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
