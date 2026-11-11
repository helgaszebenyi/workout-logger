import { formatDate, groupSets, parseDate, plural } from '../lib/format.js';

// One workout: the date stamp, title, summary, Edit/Delete and the exercises.
export default function WorkoutCard({ workout, onEdit, onDelete }) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  return (
    <article className="workout">
      <DateSeal date={workout.date} />

      <div className="workout-body">
        <div className="workout-head">
          <div>
            <h4 className="workout-title">{workout.title}</h4>
            <p className="workout-meta muted small">
              <span>{plural(workout.exercises.length, 'exercise')}</span>
              <span>{plural(totalSets, 'set')}</span>
            </p>
          </div>
          <div className="row">
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onEdit(workout)}>
              Edit
            </button>
            <button type="button" className="btn btn-ghost btn-small btn-danger" onClick={() => onDelete(workout)}>
              Delete
            </button>
          </div>
        </div>

        <ul className="workout-exercises">
          {workout.exercises.map((exercise, index) => (
            // The position is a fine key here: exercises are only shown, never reordered.
            <li key={index}>
              <span className="exercise-label">{exercise.name}</span>
              <span className="set-pills">
                {groupSets(exercise.sets).map((text, i) => (
                  <span className="pill" key={i}>{text}</span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

// The pink date "stamp": weekday above the day number. The full date is
// kept for screen readers and as a tooltip.
function DateSeal({ date }) {
  const full = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <time className="date-seal" dateTime={date} title={full} aria-label={full}>
      <span className="seal-weekday">{formatDate(date, { weekday: 'short' })}</span>
      <span className="seal-day">{parseDate(date).getDate()}</span>
    </time>
  );
}
