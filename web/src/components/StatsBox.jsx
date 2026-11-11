import { formatNumber } from '../lib/format.js';

// The top box: "Workouts", the New workout button and the four overview numbers.
export default function StatsBox({ stats, onNewWorkout }) {
  const tiles = stats
    ? [
        [stats.totalWorkouts, stats.totalWorkouts === 1 ? 'workout' : 'workouts'],
        [stats.workoutsLast30Days, 'in the last 30 days'],
        [stats.totalSets, 'sets'],
        [stats.totalVolumeKg, 'kg lifted'],
      ]
    : [];

  return (
    <section className="hero" aria-labelledby="workouts-heading">
      <div className="section-head">
        <h2 id="workouts-heading" className="section-title">Workouts</h2>
        <button type="button" className="btn btn-blossom" onClick={onNewWorkout}>
          + New workout
        </button>
      </div>

      <div className="stats" aria-label="Training overview">
        {tiles.map(([value, label]) => (
          <div className="stat" key={label}>
            <span className="stat-value">{formatNumber(value)}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
