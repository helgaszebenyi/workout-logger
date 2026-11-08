import { ValidationError } from '../errors.js';

// Limits for user input, all in one place.
const LIMITS = Object.freeze({
  titleMax: 80,
  exerciseNameMax: 60,
  maxExercises: 30,
  maxSetsPerExercise: 20,
  maxReps: 1000,
  maxDurationSec: 3600,
  maxWeightKg: 1000,
});

// One exercise and its sets. A set is either
//   { reps, weightKg? }   e.g. bench press, push-ups
//   { durationSec }       e.g. plank
export class Exercise {
  constructor(name, sets) {
    this.name = name;
    this.sets = sets;
  }

  // Checks untrusted input. Problems are collected in `problems` instead of
  // stopping at the first one, so the user sees everything that's wrong at once.
  // `path` names this exercise in messages, e.g. "exercises[0]".
  static parse(input, path, problems) {
    if (typeof input !== 'object' || input === null) {
      problems.push(`${path} must be an object`);
      return null;
    }

    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      problems.push(`${path}.name is required`);
    } else if (name.length > LIMITS.exerciseNameMax) {
      problems.push(`${path}.name must be at most ${LIMITS.exerciseNameMax} characters`);
    }

    if (!Array.isArray(input.sets) || input.sets.length === 0) {
      problems.push(`${path}.sets must be a non-empty list`);
      return null;
    }
    if (input.sets.length > LIMITS.maxSetsPerExercise) {
      problems.push(`${path}.sets can have at most ${LIMITS.maxSetsPerExercise} entries`);
    }

    const sets = input.sets.map((set, i) => parseSet(set, `${path}.sets[${i}]`, problems));
    return new Exercise(name, sets);
  }

  // Total weight moved: reps × weight, summed over all sets.
  // Bodyweight and timed sets add nothing.
  get volumeKg() {
    return this.sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weightKg ?? 0), 0);
  }

  // This exercise's best performance, used for personal records:
  // the heaviest weight if any set has one, otherwise the longest time,
  // otherwise the most reps. Returns { kind: 'weight' | 'time' | 'reps', value }.
  get best() {
    const weights = this.sets.map((set) => set.weightKg ?? 0);
    if (Math.max(...weights) > 0) return { kind: 'weight', value: Math.max(...weights) };

    const durations = this.sets.map((set) => set.durationSec ?? 0);
    if (Math.max(...durations) > 0) return { kind: 'time', value: Math.max(...durations) };

    return { kind: 'reps', value: Math.max(...this.sets.map((set) => set.reps ?? 0)) };
  }

  // Plain-object shape, used for storage and for JSON responses.
  toJSON() {
    return { name: this.name, sets: this.sets };
  }
}

// A workout session: what the user did on one date.
export class Workout {
  constructor({ title, date, exercises }) {
    this.title = title;
    this.date = date;
    this.exercises = exercises;
  }

  get totalSets() {
    return this.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  }

  get totalVolumeKg() {
    return this.exercises.reduce((sum, exercise) => sum + exercise.volumeKg, 0);
  }

  // Rebuilds a Workout from data already in the database. That data was
  // validated when it was saved, so it's trusted and not checked again.
  static fromStored(data) {
    return new Workout({
      title: data.title,
      date: data.date,
      exercises: data.exercises.map((exercise) => new Exercise(exercise.name, exercise.sets)),
    });
  }

  // Builds a Workout from untrusted request data.
  // Throws a ValidationError listing every problem found.
  static fromInput(input) {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new ValidationError(['Body must be a JSON object']);
    }
    const problems = [];

    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) {
      problems.push('title is required');
    } else if (title.length > LIMITS.titleMax) {
      problems.push(`title must be at most ${LIMITS.titleMax} characters`);
    }

    if (!isRealDate(input.date)) {
      problems.push('date must be a valid date in YYYY-MM-DD format');
    }

    let exercises = [];
    if (!Array.isArray(input.exercises) || input.exercises.length === 0) {
      problems.push('exercises must be a non-empty list');
    } else if (input.exercises.length > LIMITS.maxExercises) {
      problems.push(`exercises can have at most ${LIMITS.maxExercises} entries`);
    } else {
      exercises = input.exercises.map((exercise, i) => Exercise.parse(exercise, `exercises[${i}]`, problems));
    }

    if (problems.length > 0) throw new ValidationError(problems);

    return new Workout({ title, date: input.date, exercises });
  }

  // Plain-object shape for the database.
  toStorage() {
    return {
      title: this.title,
      date: this.date,
      exercises: this.exercises.map((exercise) => exercise.toJSON()),
    };
  }
}

// Checks one set and returns a clean copy containing only the allowed fields.
function parseSet(set, path, problems) {
  if (typeof set !== 'object' || set === null) {
    problems.push(`${path} must be an object`);
    return null;
  }

  const hasReps = set.reps !== undefined;
  const hasDuration = set.durationSec !== undefined;
  if (hasReps === hasDuration) {
    problems.push(`${path} must have exactly one of reps or durationSec`);
    return null;
  }

  if (hasDuration) {
    if (!isWholeNumberBetween(set.durationSec, 1, LIMITS.maxDurationSec)) {
      problems.push(`${path}.durationSec must be a whole number between 1 and ${LIMITS.maxDurationSec}`);
    }
    if (set.weightKg !== undefined) {
      problems.push(`${path}.weightKg is only allowed together with reps`);
    }
    return { durationSec: set.durationSec };
  }

  if (!isWholeNumberBetween(set.reps, 1, LIMITS.maxReps)) {
    problems.push(`${path}.reps must be a whole number between 1 and ${LIMITS.maxReps}`);
  }
  if (set.weightKg === undefined) return { reps: set.reps };

  if (typeof set.weightKg !== 'number' || !(set.weightKg >= 0 && set.weightKg <= LIMITS.maxWeightKg)) {
    problems.push(`${path}.weightKg must be a number between 0 and ${LIMITS.maxWeightKg}`);
  }
  return { reps: set.reps, weightKg: set.weightKg };
}

function isWholeNumberBetween(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

// True for a real calendar date like "2026-11-05"; false for "2026-02-30" or "05/11/2026".
function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // An impossible date "rolls over" (Feb 30 -> Mar 2), so the parts no longer match.
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
