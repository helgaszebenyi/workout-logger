import { useState } from 'react';
import { api, auth } from '../services.js';
import { useWorkouts } from '../hooks/useWorkouts.js';
import TopBar from './TopBar.jsx';
import StatsBox from './StatsBox.jsx';
import RecordsPanel from './RecordsPanel.jsx';
import WorkoutList from './WorkoutList.jsx';
import WorkoutForm from './WorkoutForm.jsx';

// Everything a signed-in user sees. It only exists while someone is signed
// in, so when they sign out, React throws it away together with their data:
// nothing from the last user is left on screen.
export default function SignedInApp({ user }) {
  const { workouts, stats, error, refresh } = useWorkouts();
  const [actionError, setActionError] = useState('');
  // Which workout the form is open for: null = closed, 'new' = a new workout,
  // or the workout being edited.
  const [editing, setEditing] = useState(null);

  // Called by the form on Save. If it throws, the form stays open and shows the error.
  async function handleSave(data, id) {
    if (id) {
      await api.updateWorkout(id, data);
    } else {
      await api.createWorkout(data);
    }
    setEditing(null); // close the form
    await refresh(); // redraw from the server, the single source of truth
  }

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

  return (
    <div className="page">
      <TopBar email={user.email} onSignOut={() => auth.signOut()} />
      <StatsBox stats={stats} onNewWorkout={() => setEditing('new')} />

      <div className="content">
        <RecordsPanel records={stats?.personalRecords ?? []} />

        <main className="workouts-column">
          {error && <p className="error" role="alert">Couldn&apos;t load your workouts: {error}</p>}
          {actionError && <p className="error" role="alert">{actionError}</p>}
          <WorkoutList workouts={workouts} onEdit={setEditing} onDelete={handleDelete} />
        </main>
      </div>

      {/* The popup only exists while it's open, so it starts fresh every time. */}
      {editing && (
        <WorkoutForm
          workout={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
