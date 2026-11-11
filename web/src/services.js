// Creates the app-wide services once, so every component shares the same ones.
import { AuthService } from './lib/auth.js';
import { ApiClient } from './lib/api.js';

// window.APP_CONFIG comes from config.js, loaded in index.html.
export const auth = new AuthService(window.APP_CONFIG.firebase);

// The API client asks auth for a fresh token before every request.
export const api = new ApiClient(() => auth.getToken());
