import { AuthService, friendlyAuthError } from './auth.js';

const auth = new AuthService(window.APP_CONFIG.firebase);

const authView = document.querySelector('#auth-view');
const appView = document.querySelector('#app-view');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');

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

// Show the right view whenever the user signs in or out.
auth.onChange((user) => {
  authView.hidden = Boolean(user);
  appView.hidden = !user;

  if (user) {
    document.querySelector('#user-email').textContent = user.email;
  } else {
    authForm.reset();
  }
});