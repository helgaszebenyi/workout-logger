// The contract every workout storage must follow: which methods exist, what
// they take and what they return. The service only ever relies on these
// methods, so any storage that follows the contract can be plugged in.

// JavaScript has no `abstract` keyword (unlike Java), so this class fakes it:
// it can't be created directly, and every method throws until a subclass
// overrides it.
export class WorkoutRepository {
  constructor() {
    if (new.target === WorkoutRepository) {
      throw new TypeError('WorkoutRepository is abstract; use a subclass such as FirestoreWorkoutRepository');
    }
  }

  // All of one user's workouts, newest first: [{ id, ...data }]
  async findAllByUser(_userId) {
    throw new Error('findAllByUser() is not implemented');
  }

  // One workout, or null if it doesn't exist for this user.
  async findById(_userId, _id) {
    throw new Error('findById() is not implemented');
  }

  // Saves a new workout and returns it with its new id.
  async create(_userId, _data) {
    throw new Error('create() is not implemented');
  }

  // Replaces a workout's data and returns it.
  async update(_userId, _id, _data) {
    throw new Error('update() is not implemented');
  }

  // Returns true if something was deleted, false if it didn't exist.
  async delete(_userId, _id) {
    throw new Error('delete() is not implemented');
  }
}