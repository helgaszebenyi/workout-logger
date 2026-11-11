import { useEffect, useRef, useState } from 'react';

// The API accepts timed sets up to 60 minutes.
const MAX_SECONDS = 3600;

// The popup form for creating and editing a workout.
//
// Everything the user types lives in one piece of React state, `form`:
//   { title, date, exercises: [{ id, name, timed, sets: [{ id, reps, weightKg, minutes, seconds }] }] }
// Adding a set or switching to Time just changes that state, and React redraws
// the form to match. Inputs hold text, so numbers are converted on save.
// Timed sets are entered as minutes + seconds; the API stores seconds.
//
// The component exists only while the popup is open (SignedInApp decides),
// so every opening starts with fresh state.
export default function WorkoutForm({ workout, onSave, onClose }) {
  const [form, setForm] = useState(() => toFormState(workout));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  // Open the <dialog> as a modal when the component appears.
  // (The check avoids opening it twice in development, where React
  // deliberately runs effects twice to catch mistakes.)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog.open) dialog.showModal();
  }, []);

  // ---- Updating the state ----
  // State is never changed in place: each update builds a new object with the
  // change applied. That's how React notices something changed and redraws.

  function updateExercise(exerciseId, changes) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...changes } : exercise,
      ),
    }));
  }

  function updateSet(exerciseId, setId, changes) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...changes } : set)),
            },
      ),
    }));
  }

  function addExercise() {
    setForm((current) => ({ ...current, exercises: [...current.exercises, newExercise()] }));
  }

  function removeExercise(exerciseId) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId),
    }));
  }

  // A new set copies the previous one: lifters usually repeat the same numbers.
  function addSet(exerciseId) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const previous = exercise.sets.at(-1);
        const set = previous ? { ...previous, id: newId() } : newSet();
        return { ...exercise, sets: [...exercise.sets, set] };
      }),
    }));
  }

  function removeSet(exerciseId, setId) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
          : exercise,
      ),
    }));
  }

  // ---- Saving ----

  async function handleSubmit(event) {
    event.preventDefault(); // we save with the API instead of a page reload

    const problem = findProblem(form);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setSaving(true); // disables Save, so a double click can't save twice
    try {
      await onSave(toApiShape(form), workout?.id ?? null);
    } catch (err) {
      // A validation error from the API lists every problem; show them all.
      setError(`Couldn't save: ${err.details?.length ? err.details.join('; ') : err.message}`);
      setSaving(false);
    }
  }

  return (
    // onClose also fires when the user presses Escape.
    <dialog ref={dialogRef} className="dialog" onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <h2>{workout ? 'Edit workout' : 'New workout'}</h2>

        <div className="grid-2">
          <label>
            Title
            <input
              maxLength={80}
              required
              placeholder="e.g. Push day"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
        </div>

        <fieldset>
          <legend>Exercises</legend>
          <div className="stack">
            {form.exercises.map((exercise) => (
              <ExerciseEditor
                key={exercise.id}
                exercise={exercise}
                onChange={(changes) => updateExercise(exercise.id, changes)}
                onRemove={() => removeExercise(exercise.id)}
                onAddSet={() => addSet(exercise.id)}
                onChangeSet={(setId, changes) => updateSet(exercise.id, setId, changes)}
                onRemoveSet={(setId) => removeSet(exercise.id, setId)}
              />
            ))}
          </div>
          <button type="button" className="btn btn-ghost" onClick={addExercise}>
            + Add exercise
          </button>
        </fieldset>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="row row-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            Save
          </button>
        </div>
      </form>
    </dialog>
  );
}

// One exercise: name, Reps/Time, and its sets as a small table.
function ExerciseEditor({ exercise, onChange, onRemove, onAddSet, onChangeSet, onRemoveSet }) {
  return (
    <div className="exercise">
      <div className="exercise-head">
        <input
          className="exercise-name"
          placeholder="Exercise name"
          maxLength={60}
          required
          aria-label="Exercise name"
          value={exercise.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <select
          aria-label="Measured by"
          value={exercise.timed ? 'time' : 'reps'}
          onChange={(event) => onChange({ timed: event.target.value === 'time' })}
        >
          <option value="reps">Reps</option>
          <option value="time">Time</option>
        </select>
        <button type="button" className="btn btn-icon" aria-label="Remove exercise" onClick={onRemove}>
          ✕
        </button>
      </div>

      {/* Column headings for the sets below: Reps + kg, or Min + Sec. */}
      <div className="set-grid set-columns" aria-hidden="true">
        <span>Set</span>
        <span>{exercise.timed ? 'Min' : 'Reps'}</span>
        <span>{exercise.timed ? 'Sec' : 'kg'}</span>
        <span />
      </div>

      <div className="sets">
        {exercise.sets.map((set, index) => (
          <div className="set set-grid" key={set.id}>
            <span className="set-number">{index + 1}</span>
            {exercise.timed ? (
              // Timed set (e.g. plank): minutes and seconds.
              <>
                <input
                  type="number"
                  min={0}
                  max={60}
                  placeholder="0"
                  aria-label={`Set ${index + 1} minutes`}
                  value={set.minutes}
                  onChange={(event) => onChangeSet(set.id, { minutes: event.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  aria-label={`Set ${index + 1} seconds`}
                  value={set.seconds}
                  onChange={(event) => onChangeSet(set.id, { seconds: event.target.value })}
                />
              </>
            ) : (
              // Reps set: reps and an optional weight.
              <>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  required
                  aria-label={`Set ${index + 1} reps`}
                  value={set.reps}
                  onChange={(event) => onChangeSet(set.id, { reps: event.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={0.5}
                  aria-label={`Set ${index + 1} weight in kg`}
                  value={set.weightKg}
                  onChange={(event) => onChangeSet(set.id, { weightKg: event.target.value })}
                />
              </>
            )}
            <button
              type="button"
              className="btn btn-icon"
              aria-label={`Remove set ${index + 1}`}
              onClick={() => onRemoveSet(set.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost btn-small add-set" onClick={onAddSet}>
        + Add set
      </button>
    </div>
  );
}

// ---- Helpers ----

// React needs a stable `key` for every exercise and set row. A simple counter
// is enough: the ids only need to be unique while the form is open.
let lastId = 0;
function newId() {
  lastId += 1;
  return lastId;
}

// Each set keeps both kinds of fields, so switching an exercise between
// Reps and Time and back doesn't lose what was typed.
function newSet() {
  return { id: newId(), reps: '', weightKg: '0', minutes: '', seconds: '' };
}

function newExercise() {
  return { id: newId(), name: '', timed: false, sets: [newSet()] };
}

// API workout (or null for a new one) -> form state.
function toFormState(workout) {
  if (!workout) {
    return { title: '', date: todayIso(), exercises: [newExercise()] };
  }
  return {
    title: workout.title,
    date: workout.date,
    exercises: workout.exercises.map((exercise) => ({
      id: newId(),
      name: exercise.name,
      // An exercise is timed if its sets use durationSec (e.g. plank).
      timed: Boolean(exercise.sets[0]?.durationSec),
      sets: exercise.sets.map((set) => ({
        id: newId(),
        reps: set.reps === undefined ? '' : String(set.reps),
        weightKg: String(set.weightKg ?? 0),
        // 90 seconds -> 1 min 30 sec
        minutes: set.durationSec === undefined ? '' : String(Math.floor(set.durationSec / 60)),
        seconds: set.durationSec === undefined ? '' : String(set.durationSec % 60),
      })),
    })),
  };
}

// Form state -> the shape the API expects:
// { title, date, exercises: [{ name, sets: [{ reps, weightKg? } | { durationSec }] }] }
function toApiShape(form) {
  return {
    title: form.title.trim(),
    date: form.date,
    exercises: form.exercises.map((exercise) => ({
      name: exercise.name.trim(),
      sets: exercise.sets.map((set) => {
        if (exercise.timed) return { durationSec: totalSeconds(set) };
        const reps = Number(set.reps);
        const weightKg = Number(set.weightKg);
        // Leave weight out for bodyweight sets.
        return weightKg > 0 ? { reps, weightKg } : { reps };
      }),
    })),
  };
}

// 1 min 30 sec -> 90. Empty fields count as 0.
function totalSeconds(set) {
  return Number(set.minutes || 0) * 60 + Number(set.seconds || 0);
}

// Checks what the browser's own input checks can't. Returns a message, or ''.
function findProblem(form) {
  if (form.exercises.length === 0 || form.exercises.some((exercise) => exercise.sets.length === 0)) {
    return 'Add at least one exercise, each with at least one set.';
  }
  for (const exercise of form.exercises) {
    if (!exercise.timed) continue;
    const name = exercise.name.trim() || 'A timed exercise';
    for (const set of exercise.sets) {
      const total = totalSeconds(set);
      if (total < 1) return `${name}: every set needs a time.`;
      if (total > MAX_SECONDS) return `${name}: a set can be at most 60 minutes.`;
    }
  }
  return '';
}

// Today's date in the user's time zone, as YYYY-MM-DD (what <input type="date"> uses).
function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
