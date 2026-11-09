import { el, plural, formatDuration, parseDate } from '../dom.js';

// All dates in the app are shown in English, whatever the computer's language.
const LOCALE = 'en-GB';

// Draws the list of workouts into `root`, replacing whatever was there.
// Workouts are sorted by date (newest first), and each month gets its own box.
// The view only reports Edit/Delete clicks through the callbacks;
// main.js decides what actually happens.
export function renderWorkoutList(root, workouts, { onEdit, onDelete }) {
  if (workouts.length === 0) {
    root.replaceChildren(
      el('div', { class: 'empty' },
        el('p', {}, 'No workouts yet.'),
        el('p', { class: 'small' }, 'Click “New workout” to log your first session.'),
      ),
    );
    return;
  }

  const sorted = [...workouts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  // Group into months: "2026-11" -> [workouts...], keeping the sorted order.
  const months = new Map();
  for (const workout of sorted) {
    const month = workout.date.slice(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(workout);
  }

  root.replaceChildren(
    ...[...months].map(([month, monthWorkouts]) =>
      el('section', { class: 'month-group' },
        el('h3', { class: 'month-heading' }, formatMonth(month)),
        ...monthWorkouts.map((workout) => workoutCard(workout, onEdit, onDelete)),
      ),
    ),
  );
}

function workoutCard(workout, onEdit, onDelete) {
  const editButton = el('button', { type: 'button', class: 'btn btn-ghost btn-small' }, 'Edit');
  editButton.addEventListener('click', () => onEdit(workout));

  const deleteButton = el('button', { type: 'button', class: 'btn btn-ghost btn-small btn-danger' }, 'Delete');
  deleteButton.addEventListener('click', () => onDelete(workout));

  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  return el('article', { class: 'workout' },
    dateSeal(workout.date),
    el('div', { class: 'workout-body' },
      el('div', { class: 'workout-head' },
        el('div', {},
          el('h4', { class: 'workout-title' }, workout.title),
          el('p', { class: 'workout-meta muted small' },
            el('span', {}, plural(workout.exercises.length, 'exercise')),
            el('span', {}, plural(totalSets, 'set')),
          ),
        ),
        el('div', { class: 'row' }, editButton, deleteButton),
      ),
      el('ul', { class: 'workout-exercises' },
        ...workout.exercises.map((exercise) =>
          el('li', {},
            el('span', { class: 'exercise-label' }, exercise.name),
            el('span', { class: 'set-pills' },
              ...groupSets(exercise.sets).map((text) => el('span', { class: 'pill' }, text)),
            ),
          ),
        ),
      ),
    ),
  );
}

// The date "stamp" on the left of each card: weekday above the day number.
// The full date is kept for screen readers and as a tooltip.
function dateSeal(isoDate) {
  const date = parseDate(isoDate);
  const full = date.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return el('time', { class: 'date-seal', datetime: isoDate, title: full, 'aria-label': full },
    el('span', { class: 'seal-weekday' }, date.toLocaleDateString(LOCALE, { weekday: 'short' })),
    el('span', { class: 'seal-day' }, date.getDate()),
  );
}

// "2026-11" -> "November 2026"
function formatMonth(yearMonth) {
  return parseDate(`${yearMonth}-01`).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

// How one set reads: "5 reps @ 80 kg", "1:20" (plank) or "1 rep".
function describeSet(set) {
  const amount = set.durationSec ? formatDuration(set.durationSec) : plural(set.reps, 'rep');
  return set.weightKg ? `${amount} @ ${set.weightKg} kg` : amount;
}

// Groups identical sets in a row, one pill each:
// [5@80, 5@80, 3@90] -> ["2 × 5 reps @ 80 kg", "3 reps @ 90 kg"]
export function groupSets(sets) {
  const groups = [];
  for (const set of sets) {
    const text = describeSet(set);
    const last = groups.at(-1);
    if (last && last.text === text) last.count += 1;
    else groups.push({ text, count: 1 });
  }
  return groups.map(({ text, count }) => (count > 1 ? `${count} × ${text}` : text));
}
