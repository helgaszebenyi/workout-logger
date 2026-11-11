import WorkoutCard from './WorkoutCard.jsx';
import { formatMonth } from '../lib/format.js';

// The workouts, newest first, with one box per month.
// workouts is null while loading.
export default function WorkoutList({ workouts, onEdit, onDelete }) {
  if (workouts === null) {
    return <p className="muted">Loading…</p>;
  }

  if (workouts.length === 0) {
    return (
      <div className="empty">
        <p>No workouts yet.</p>
        <p className="small">Click “New workout” to log your first session.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {groupByMonth(workouts).map(([month, monthWorkouts]) => (
        <section className="month-group" key={month}>
          <h3 className="month-heading">{formatMonth(month)}</h3>
          {monthWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </section>
      ))}
    </div>
  );
}

// Sorts by date (newest first) and groups into months:
// [["2026-11", [workouts...]], ["2026-10", [...]], ...]
function groupByMonth(workouts) {
  const sorted = [...workouts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const months = new Map();
  for (const workout of sorted) {
    const month = workout.date.slice(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month).push(workout);
  }
  return [...months];
}
