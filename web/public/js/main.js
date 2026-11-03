// Entry point: connects auth, the API and the views, and switches
// between the signed-out view and the signed-in view.
import { AuthService, friendlyAuthError } from './auth.js';
import { ApiClient } from './api.js';
import { el } from './dom.js';
import { renderWorkoutList } from './views/workoutListView.js';
import { WorkoutForm } from './views/workoutFormView.js';

const auth = new AuthService(window.APP_CONFIG.firebase);
// The API client asks auth for a fresh token before every request
const api = new ApiClient(() => auth.getToken());
// The popup form calls saveWorkout when the user clicks Save
const workoutForm = new WorkoutForm(saveWorkout);

const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const appError = document.querySelector('#app-error');
const workoutsSection = document.querySelector('#workouts');

// ---- Signed out ----

// Sign in or create an account, depending on which button was clicked
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
    authError.textContent = friendlyAuthError(error);
    authError.hidden = false;
  }
});

// ---- Signed in ----

document.querySelector('#sign-out').addEventListener('click', () => auth.signOut());
document.querySelector('#new-workout').addEventListener('click', () => workoutForm.open());

// Loads the user's workouts from the API and draws them
async function loadWorkouts() {
  try {
    const workouts = await api.listWorkouts();
    renderWorkoutList(workoutsSection, workouts, {
      onEdit: (workout) => workoutForm.open(workout),
      onDelete: deleteWorkout,
    });
  } catch (error) {
    workoutsSection.replaceChildren(
      el('p', { role: 'alert' }, `Couldn't load your workouts: ${error.message}`),
    );
  }
}

// Called by the form on Save, errors are passed back so the form can show them
async function saveWorkout(data, id) {
  if (id) {
    await api.updateWorkout(id, data);
  } else {
    await api.createWorkout(data);
  }
  await loadWorkouts(); // redraw from the server, the single source of truth
}

async function deleteWorkout(workout) {
  if (!confirm(`Delete "${workout.title}"? This can't be undone.`)) return;

  appError.hidden = true;
  try {
    await api.deleteWorkout(workout.id);
    await loadWorkouts();
  } catch (error) {
    appError.textContent = `Couldn't delete the workout: ${error.message}`;
    appError.hidden = false;
  }
}

// ---- Switching views ----

// Show the right view whenever the user signs in or out.
auth.onChange((user) => {
  authView.hidden = Boolean(user);
  appView.hidden = !user;

  if (user) {
    document.querySelector('#user-email').textContent = user.email;
    workoutsSection.replaceChildren(el('p', {}, 'Loading…'));
    loadWorkouts();
  } else {
    authForm.reset();
    workoutsSection.replaceChildren(); // don't leave the last user's data on screen
  }
});