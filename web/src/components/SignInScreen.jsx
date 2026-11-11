import { useState } from 'react';
import { auth } from '../services.js';
import { friendlyAuthError } from '../lib/auth.js';

// The signed-out screen: email/password sign-in, account creation and Google.
// After a successful sign-in, Firebase notifies useAuth and App switches screens,
// so this component never has to "navigate" anywhere itself.
export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Runs a sign-in function, showing a friendly message if it fails.
  async function attempt(signInFunction) {
    setError('');
    setBusy(true);
    try {
      await signInFunction();
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    // Both buttons submit the form; the clicked one says which action it is.
    const action = event.nativeEvent.submitter?.dataset.action;
    attempt(() => (action === 'sign-up' ? auth.signUp(email, password) : auth.signIn(email, password)));
  }

  return (
    <main className="auth">
      <section className="auth-card">
        <h1 className="brand">Workout Logger</h1>
        <p className="muted">Log every session. Watch the numbers go up.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="row">
            <button type="submit" data-action="sign-in" className="btn btn-primary" disabled={busy}>
              Sign in
            </button>
            <button type="submit" data-action="sign-up" className="btn" disabled={busy}>
              Create account
            </button>
          </div>
        </form>

        <div className="divider"><span>or</span></div>
        <button
          type="button"
          className="btn btn-block"
          disabled={busy}
          onClick={() => attempt(() => auth.signInWithGoogle())}
        >
          Continue with Google
        </button>
      </section>
    </main>
  );
}
