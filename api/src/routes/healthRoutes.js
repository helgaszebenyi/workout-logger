import { Router } from 'express';

// Health checks, used by Docker and Kubernetes. Both are public: they're
// registered before the token check.
//   /healthz  "Is the process alive?" Never touches the database, so a slow
//             database doesn't get the container restarted for nothing.
//   /readyz   "Can this instance serve requests right now?" Checks the
//             database. While it fails, Kubernetes stops sending traffic here
//             but leaves the container running.
//
// checkReady throws if a dependency is down. It's passed in so tests can fake it.
export function createHealthRouter(checkReady = async () => {}) {
  const router = Router();

  router.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/readyz', async (req, res) => {
    try {
      await checkReady();
      res.json({ status: 'ready' });
    } catch (error) {
      console.error('Readiness check failed:', error.message);
      res.status(503).json({ status: 'unavailable' });
    }
  });

  return router;
}
