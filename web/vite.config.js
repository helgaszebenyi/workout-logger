import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite: the development server and the production build tool for the React app.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development, forward /api to the API running on your machine
    // (npm run dev in api/). The page and the API then share one address,
    // just like nginx does in Docker and Kubernetes, so CORS isn't needed.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
