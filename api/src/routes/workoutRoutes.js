import { Router } from 'express';

// HTTP routes for workouts, mounted at /api/workouts.
// Thin on purpose: read the request, call the service, send the response.
export function createWorkoutRouter(service) {
  const router = Router();
  const notFound = (res) => res.status(404).json({ error: 'Workout not found' });

  router.get('/', async (req, res) => {
    const workouts = await service.listWorkouts(req.user.uid);
    res.json({ workouts });
  });

  router.get('/:id', async (req, res) => {
    const workout = await service.getWorkout(req.user.uid, req.params.id);
    if (!workout) return notFound(res);
    res.json({ workout });
  });

  router.post('/', async (req, res) => {
    const workout = await service.createWorkout(req.user.uid, req.body);
    res.status(201).json({ workout });
  });

  router.put('/:id', async (req, res) => {
    const workout = await service.updateWorkout(req.user.uid, req.params.id, req.body);
    if (!workout) return notFound(res);
    res.json({ workout });
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await service.deleteWorkout(req.user.uid, req.params.id);
    if (!deleted) return notFound(res);
    res.status(204).end();
  });

  return router;
}