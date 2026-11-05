// Business logic for workouts: what happens, independent of HTTP and storage.
//   routes -> WorkoutService -> repository
export class WorkoutService {
  constructor(repository) {
    this.repository = repository;
  }

  listWorkouts(userId) {
    return this.repository.findAllByUser(userId);
  }

  // Returns null if the workout doesn't exist.
  getWorkout(userId, id) {
    return this.repository.findById(userId, id);
  }

  createWorkout(userId, input) {
    const { title, date, exercises } = input;
    return this.repository.create(userId, {
      title,
      date,
      exercises,
      createdAt: new Date().toISOString(),
    });
  }

  // Replaces a workout's content but keeps its original creation time.
  // Returns null if the workout doesn't exist.
  async updateWorkout(userId, id, input) {
    const existing = await this.repository.findById(userId, id);
    if (!existing) return null;

    const { title, date, exercises } = input;
    return this.repository.update(userId, id, {
      title,
      date,
      exercises,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }

  // Returns false if the workout didn't exist.
  deleteWorkout(userId, id) {
    return this.repository.delete(userId, id);
  }
}