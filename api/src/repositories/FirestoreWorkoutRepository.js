import { WorkoutRepository } from './WorkoutRepository.js';

// All Firestore code for workouts lives here. The rest of the app calls these
// methods and never touches Firestore directly (the Repository pattern).
// Data layout: users/{userId}/workouts/{workoutId}
export class FirestoreWorkoutRepository extends WorkoutRepository {
  constructor(db) {
    super(); // a subclass must call the parent's constructor first
    this.db = db;
  }

  // One user's workouts folder. Private (#): only this class needs it.
  #collection(userId) {
    return this.db.collection('users').doc(userId).collection('workouts');
  }

  async findAllByUser(userId) {
    const snapshot = await this.#collection(userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Returns the workout, or null if it doesn't exist for this user.
  async findById(userId, id) {
    const doc = await this.#collection(userId).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async create(userId, data) {
    const ref = await this.#collection(userId).add(data);
    return { id: ref.id, ...data };
  }

  async update(userId, id, data) {
    await this.#collection(userId).doc(id).set(data);
    return { id, ...data };
  }

  // Returns true if something was deleted, false if it didn't exist.
  async delete(userId, id) {
    const ref = this.#collection(userId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
}