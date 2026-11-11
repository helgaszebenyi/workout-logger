import { useEffect, useState } from 'react';
import { auth } from '../services.js';

// The current user, kept up to date as they sign in and out:
//   undefined -> still checking (right after the page loads)
//   null      -> signed out
//   object    -> signed in (has .email, .uid, ...)
export function useAuth() {
  const [user, setUser] = useState(undefined);

  // Start listening when the component appears; onChange returns the
  // "stop listening" function, which React calls when it goes away.
  useEffect(() => auth.onChange(setUser), []);

  return user;
}
