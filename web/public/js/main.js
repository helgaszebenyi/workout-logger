import { AuthService, friendlyAuthError } from './auth.js';
import { ApiClient } from './api.js';
import { el } from './dom.js';
import { renderWorkoutList } from './views/workoutListView.js';

const auth = new AuthService(window.APP_CONFIG.firebase);
// The API client asks auth for a fresh token before every request
const api = new ApiClient(() => auth.getToken());

const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const workoutsSection = document.querySelector('#workouts');

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
    authError.textContent = friendlyAuthError(error);
    authError.hidden = false;
  }
});

document.querySelector('#sign-out').addEventListener('click', () => auth.signOut());

// Loads the user's workouts from the API and draws them
async function loadWorkouts() {
  workoutsSection.replaceChildren(el('p', {}, 'Loading…'));
  try {
    const workouts = await api.listWorkouts();
    renderWorkoutList(workoutsSection, workouts);
  } catch (error) {
    workoutsSection.replaceChildren(
      el('p', { role: 'alert' }, `Couldn't load your workouts: ${error.message}`),
    );
  }
}

// Show the right view whenever the user signs in or out
auth.onChange((user) => {
  authView.hidden = Boolean(user);
  appView.hidden = !user;

  if (user) {
    document.querySelector('#user-email').textContent = user.email;
    loadWorkouts();
  } else {
    authForm.reset();
    workoutsSection.replaceChildren(); // don't leave the last user's data on screen
  }
});