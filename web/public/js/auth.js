import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

// Firebase error codes turned into messages a user can act on.
const FRIENDLY_ERRORS = {
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
};

export function friendlyAuthError(error) {
  return FRIENDLY_ERRORS[error.code] ?? 'Something went wrong. Please try again.';
}

export class AuthService {
  constructor(firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
  }


  onChange(callback) {
    onAuthStateChanged(this.auth, callback);
  }

  signIn(email, password) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signUp(email, password) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  signOut() {
    return signOut(this.auth);
  }


  getToken() {
    return this.auth.currentUser.getIdToken();
  }
}