import { randomUUID } from 'node:crypto';
import { WorkoutRepository } from './WorkoutRepository.js';

// Keeps workouts in a Map in memory: fast and needs no database, which makes
// it perfect for tests. Everything is lost when the process stops, so it's
// never used in production.
export class InMemoryWorkoutRepository extends WorkoutRepository {
  // id -> { userId, data }
  #store = new Map();

  async findAllByUser(userId) {
    return [...this.#store.entries()]
      .filter(([, entry]) => entry.userId === userId)
      .map(([id, entry]) => ({ id, ...structuredClone(entry.data) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first, like Firestore's orderBy
  }

  async findById(userId, id) {
    const entry = this.#store.get(id);
    // Another user's workout behaves exactly like a missing one.
    if (!entry || entry.userId !== userId) return null;
    return { id, ...structuredClone(entry.data) };
  }

  async create(userId, data) {
    const id = randomUUID();
    this.#store.set(id, { userId, data: structuredClone(data) });
    return { id, ...data };
  }

  async update(userId, id, data) {
    this.#store.set(id, { userId, data: structuredClone(data) });
    return { id, ...data };
  }

  async delete(userId, id) {
    const entry = this.#store.get(id);
    if (!entry || entry.userId !== userId) return false;
    return this.#store.delete(id);
  }
}