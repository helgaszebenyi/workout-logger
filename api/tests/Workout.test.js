// Unit tests for the Workout model: validation rules, checked in isolation.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Workout } from '../src/models/Workout.js';
import { ValidationError } from '../src/errors.js';

// A fresh, valid input for every test, so tests can't affect each other.
const validInput = () => ({
  title: 'Push day',
  date: '2026-11-05',
  exercises: [
    { name: 'Bench press', sets: [{ reps: 5, weightKg: 80 }, { reps: 5 }] },
    { name: 'Plank', sets: [{ durationSec: 60 }] },
  ],
});

// Runs fromInput and returns the list of problems it reported.
function problemsFor(input) {
  try {
    Workout.fromInput(input);
  } catch (error) {
    assert.ok(error instanceof ValidationError);
    return error.details;
  }
  assert.fail('expected a ValidationError');
}

describe('Workout.fromInput', () => {
  it('accepts a valid workout', () => {
    const workout = Workout.fromInput(validInput());
    assert.equal(workout.title, 'Push day');
    assert.equal(workout.exercises.length, 2);
  });

  it('trims whitespace around the title and exercise names', () => {
    const input = validInput();
    input.title = '  Leg day  ';
    input.exercises[0].name = ' Squat ';
    const workout = Workout.fromInput(input);
    assert.equal(workout.title, 'Leg day');
    assert.equal(workout.exercises[0].name, 'Squat');
  });

  it('drops fields that are not part of the model', () => {
    const input = { ...validInput(), userId: 'someone-else', admin: true };
    input.exercises[0].sets[0].hack = 1;
    const stored = Workout.fromInput(input).toStorage();
    assert.deepEqual(Object.keys(stored), ['title', 'date', 'exercises']);
    assert.deepEqual(stored.exercises[0].sets[0], { reps: 5, weightKg: 80 });
  });

  it('reports every problem at once', () => {
    const problems = problemsFor({ title: '', date: 'yesterday', exercises: [] });
    assert.equal(problems.length, 3);
  });

  it('rejects impossible dates', () => {
    assert.deepEqual(problemsFor({ ...validInput(), date: '2026-02-30' }), [
      'date must be a valid date in YYYY-MM-DD format',
    ]);
  });

  it('rejects a set with both reps and durationSec', () => {
    const input = validInput();
    input.exercises[0].sets[0] = { reps: 5, durationSec: 30 };
    assert.deepEqual(problemsFor(input), [
      'exercises[0].sets[0] must have exactly one of reps or durationSec',
    ]);
  });

  it('rejects weight on a timed set', () => {
    const input = validInput();
    input.exercises[1].sets[0] = { durationSec: 60, weightKg: 10 };
    assert.deepEqual(problemsFor(input), [
      'exercises[1].sets[0].weightKg is only allowed together with reps',
    ]);
  });

  it('rejects reps that are zero, fractional or text', () => {
    for (const reps of [0, 2.5, '5']) {
      const input = validInput();
      input.exercises[0].sets[0] = { reps };
      assert.equal(problemsFor(input).length, 1, `reps: ${JSON.stringify(reps)}`);
    }
  });

  it('rejects a body that is not an object', () => {
    assert.deepEqual(problemsFor(null), ['Body must be a JSON object']);
    assert.deepEqual(problemsFor([]), ['Body must be a JSON object']);
  });
});

describe('Workout calculations', () => {
  it('counts sets and volume, ignoring bodyweight and timed sets', () => {
    const workout = Workout.fromInput(validInput());
    // Bench: 5 × 80 + 5 × 0, plank: timed
    assert.equal(workout.totalSets, 3);
    assert.equal(workout.totalVolumeKg, 400);
  });

  it('picks the best set of an exercise', () => {
    const workout = Workout.fromInput({
      ...validInput(),
      exercises: [
        { name: 'Bench press', sets: [{ reps: 5, weightKg: 80 }, { reps: 3, weightKg: 90 }] },
        { name: 'Plank', sets: [{ durationSec: 60 }, { durationSec: 75 }] },
        { name: 'Push-ups', sets: [{ reps: 20 }, { reps: 25 }] },
      ],
    });
    assert.deepEqual(workout.exercises.map((exercise) => exercise.best), [
      { kind: 'weight', value: 90 },
      { kind: 'time', value: 75 },
      { kind: 'reps', value: 25 },
    ]);
  });
});
