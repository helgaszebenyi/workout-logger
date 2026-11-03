import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

// Firebase error codes turned into messages a user can act on.
const FRIENDLY_ERRORS = {
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups and try again.',
};

export function friendlyAuthError(error) {
  return FRIENDLY_ERRORS[error.code] ?? 'Something went wrong. Please try again.';
}

export class AuthService {
  constructor(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
  }

  // Calls callback(user or null) now, and every time the user signs in or out.
  onChange(callback) {
    onAuthStateChanged(this.auth, callback);
  }

  signIn(email, password) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signUp(email, password) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Opens Google's sign-in window. Works on localhost out of the box;
  // other domains must be added under Authentication -> Settings -> Authorized domains.
  signInWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  signOut() {
    return signOut(this.auth);
  }

  // The signed-in user's ID token, for the Authorization header.
  getToken() {
    return this.auth.currentUser.getIdToken();
  }
}