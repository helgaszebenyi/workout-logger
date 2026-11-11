import { useCallback, useEffect, useState } from 'react';
import { api } from '../services.js';

// Fetches the workouts and the stats at the same time, then waits for both.
async function loadAll() {
  const [workouts, stats] = await Promise.all([api.listWorkouts(), api.getStats()]);
  return { workouts, stats };
}

// Loads the signed-in user's workouts and stats from the API.
// Returns them (null while still loading), an error message if loading
// failed, and refresh() to load again after a change.
export function useWorkouts() {
  const [data, setData] = useState({ workouts: null, stats: null });
  const [error, setError] = useState('');

  // First load, when the component using this hook appears.
  // The state is only set in the callbacks, once the data has arrived.
  useEffect(() => {
    // If the component disappears before the answer arrives (for example the
    // user signs out), ignore the answer instead of updating a screen that's gone.
    let cancelled = false;
    loadAll().then(
      (result) => {
        if (cancelled) return;
        setData(result);
        setError('');
      },
      (err) => {
        if (!cancelled) setError(err.message);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Load again, e.g. after saving or deleting a workout. useCallback keeps
  // the same function between redraws.
  const refresh = useCallback(async () => {
    try {
      setData(await loadAll());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { ...data, error, refresh };
}
