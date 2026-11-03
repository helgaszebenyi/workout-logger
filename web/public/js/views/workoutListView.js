import { el, formatDate } from '../dom.js';

export function renderWorkoutList(root, workouts) {
  if (workouts.length === 0) {
    root.replaceChildren(el('p', {}, 'No workouts yet. Log your first one!'));
    return;
  }

  root.replaceChildren(...workouts.map(workoutCard));
}

function workoutCard(workout) {
  return el('article', { class: 'workout' },
    el('h3', {}, workout.title),
    el('p', { class: 'muted' }, formatDate(workout.date)),
    el('ul', {},
      ...workout.exercises.map((exercise) =>
        el('li', {}, `${exercise.name}: ${summariseSets(exercise.sets)}`),
      ),
    ),
  );
}

// How one set reads: "5 reps @ 80kg", "60s" (plank) or "20 reps". 
function describeSet(set) {
  const amount = set.durationSec ? `${set.durationSec}s` : `${set.reps} reps`;
  return set.weightKg ? `${amount} @ ${set.weightKg}kg` : amount;
}


// Groups identical sets in a row, so

export function summariseSets(sets) {
  const groups = [];
  for (const set of sets) {
    const text = describeSet(set);
    const last = groups.at(-1);
    if (last && last.text === text) last.count += 1;
    else groups.push({ text, count: 1 });
  }
  return groups
    .map(({ text, count }) => (count > 1 ? `${count} × ${text}` : text))
    .join(', ');
}