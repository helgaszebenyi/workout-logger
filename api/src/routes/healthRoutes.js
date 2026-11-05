import { Router } from 'express';

// Health check: Docker and Kubernetes call this to see if the app is alive.
// Public: it's registered before the token check.
export function createHealthRouter() {
  const router = Router();

  router.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}