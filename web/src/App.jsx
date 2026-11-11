import { useAuth } from './hooks/useAuth.js';
import SignInScreen from './components/SignInScreen.jsx';
import SignedInApp from './components/SignedInApp.jsx';

// The top of the component tree: decides which screen to show.
export default function App() {
  const user = useAuth();

  // Firebase is still checking whether someone is signed in.
  if (user === undefined) {
    return <div className="loading">Loading…</div>;
  }

  return user ? <SignedInApp user={user} /> : <SignInScreen />;
}
