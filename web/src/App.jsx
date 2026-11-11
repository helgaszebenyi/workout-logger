import { useAuth } from './hooks/useAuth.js';
import { auth } from './services.js';
import SignInScreen from './components/SignInScreen.jsx';
import TopBar from './components/TopBar.jsx';

// The top of the component tree: decides which screen to show.
export default function App() {
  const user = useAuth();

  // Firebase is still checking whether someone is signed in.
  if (user === undefined) {
    return <div className="loading">Loading…</div>;
  }

  if (user === null) {
    return <SignInScreen />;
  }

  return (
    <div className="page">
      <TopBar email={user.email} onSignOut={() => auth.signOut()} />
      {/* The workouts, stats and records come in the next step. */}
      <section className="hero">
        <h2 className="section-title">Workouts</h2>
      </section>
    </div>
  );
}
