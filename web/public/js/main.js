// Entry point: connects auth, the API and the views, and switches
// between the loading screen, the signed-out view and the signed-in view.
import { AuthService, friendlyAuthError } from './auth.js';
import { ApiClient } from './api.js';
import { el } from './dom.js';
import { renderWorkoutList } from './views/workoutListView.js';
import { renderStats, renderRecords } from './views/statsView.js';
import { WorkoutForm } from './views/workoutFormView.js';

const auth = new AuthService(window.APP_CONFIG.firebase);
// The API client asks auth for a fresh token before every request.
const api = new ApiClient(() => auth.getToken());
// The popup form calls saveWorkout when the user clicks Save.
const workoutForm = new WorkoutForm(saveWorkout);

const loadingView = document.querySelector('#loading');
const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const appError = document.querySelector('#app-error');
const workoutsSection = document.querySelector('#workouts');
const statsRoot = document.querySelector('#stats');
const recordsSection = document.querySelector('#records-section');
const recordsList = document.querySelector('#records');

// ---- Signed out ----

function showAuthError(error) {
  authError.textContent = friendlyAuthError(error);
  authError.hidden = false;
}

// Sign in or create an account, depending on which button was clicked.
authForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const action = event.submitter.dataset.action;
  const { email, password } = authForm.elements;

  authError.hidden = true;
  try {
    if (action === 'sign-up') {
      await auth.signUp(email.value, password.value);
    } else {
      await auth.signIn(email.value, password.value);
    }
  } catch (error) {
    showAuthError(error);
  }
});

document.querySelector('#google-sign-in').addEventListener('click', async () => {
  authError.hidden = true;
  try {
    await auth.signInWithGoogle();
  } catch (error) {
    showAuthError(error);
  }
});

// ---- Signed in ----

document.querySelector('#sign-out').addEventListener('click', () => auth.signOut());
document.querySelector('#new-workout').addEventListener('click', () => workoutForm.open());

// Loads the workouts and the stats from the API (both at the same time)
// and redraws the list, the overview numbers and the personal records.
async function refresh() {
  try {
    const [workouts, stats] = await Promise.all([api.listWorkouts(), api.getStats()]);
    renderWorkoutList(workoutsSection, workouts, {
      onEdit: (workout) => workoutForm.open(workout),
      onDelete: deleteWorkout,
    });
    renderStats(statsRoot, stats);
    renderRecords(recordsSection, recordsList, stats.personalRecords);
  } catch (error) {
    workoutsSection.replaceChildren(
      el('p', { class: 'error', role: 'alert' }, `Couldn't load your workouts: ${error.message}`),
    );
  }
}

// Called by the form on Save. Errors are passed back so the form can show them.
async function saveWorkout(data, id) {
  if (id) {
    await api.updateWorkout(id, data);
  } else {
    await api.createWorkout(data);
  }
  await refresh(); // redraw from the server, the single source of truth
}

async function deleteWorkout(workout) {
  if (!confirm(`Delete "${workout.title}"? This can't be undone.`)) return;

  appError.hidden = true;
  try {
    await api.deleteWorkout(workout.id);
    await refresh();
  } catch (error) {
    appError.textContent = `Couldn't delete the workout: ${error.message}`;
    appError.hidden = false;
  }
}

// ---- Switching views ----

// Runs on page load (once Firebase knows if someone is signed in)
// and every time the user signs in or out.
auth.onChange((user) => {
  loadingView.hidden = true;
  authView.hidden = Boolean(user);
  appView.hidden = !user;

  if (user) {
    document.querySelector('#user-email').textContent = user.email;
    workoutsSection.replaceChildren(el('p', { class: 'muted' }, 'Loading…'));
    refresh();
  } else {
    // Don't leave the last user's data on screen.
    authForm.reset();
    workoutsSection.replaceChildren();
    statsRoot.replaceChildren();
    recordsSection.hidden = true;
  }
});
