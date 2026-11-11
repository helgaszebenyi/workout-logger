import { useState } from 'react';
import { api, auth } from '../services.js';
import { useWorkouts } from '../hooks/useWorkouts.js';
import TopBar from './TopBar.jsx';
import StatsBox from './StatsBox.jsx';
import RecordsPanel from './RecordsPanel.jsx';
import WorkoutList from './WorkoutList.jsx';

// Everything a signed-in user sees. It only exists while someone is signed
// in, so when they sign out, React throws it away together with their data:
// nothing from the last user is left on screen.
export default function SignedInApp({ user }) {
  const { workouts, stats, error, refresh } = useWorkouts();
  const [actionError, setActionError] = useState('');

  async function handleDelete(workout) {
    if (!confirm(`Delete "${workout.title}"? This can't be undone.`)) return;
    setActionError('');
    try {
      await api.deleteWorkout(workout.id);
      await refresh(); // redraw from the server, the single source of truth
    } catch (err) {
      setActionError(`Couldn't delete the workout: ${err.message}`);
    }
  }

  // The workout form comes in the next step; these will open it.
  function handleNewWorkout() {}
  function handleEdit() {}

  return (
    <div className="page">
      <TopBar email={user.email} onSignOut={() => auth.signOut()} />
      <StatsBox stats={stats} onNewWorkout={handleNewWorkout} />

      <div className="content">
        <RecordsPanel records={stats?.personalRecords ?? []} />

        <main className="workouts-column">
          {error && <p className="error" role="alert">Couldn&apos;t load your workouts: {error}</p>}
          {actionError && <p className="error" role="alert">{actionError}</p>}
          <WorkoutList workouts={workouts} onEdit={handleEdit} onDelete={handleDelete} />
        </main>
      </div>
    </div>
  );
}
