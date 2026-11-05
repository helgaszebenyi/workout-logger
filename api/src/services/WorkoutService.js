import { Workout } from '../models/Workout.js';
import { NotFoundError } from '../errors.js';

// Business logic for workouts: what happens, independent of HTTP and storage.
//   routes -> WorkoutService -> repository
export class WorkoutService {
  constructor(repository) {
    this.repository = repository;
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
  createWorkout(userId, input) {
    const workout = Workout.fromInput(input);
    return this.repository.create(userId, {
      ...workout.toStorage(),
      createdAt: new Date().toISOString(),
    });
  }

  // Replaces a workout's content but keeps its original creation time.
  async updateWorkout(userId, id, input) {
    const workout = Workout.fromInput(input); // validate first: no database call needed if it's invalid
    const existing = await this.getWorkout(userId, id); // throws NotFoundError if missing
    return this.repository.update(userId, id, {
      ...workout.toStorage(),
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteWorkout(userId, id) {
    const deleted = await this.repository.delete(userId, id);
    if (!deleted) throw new NotFoundError('Workout');
  }
}