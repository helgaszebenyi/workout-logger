import { Router } from 'express';

// HTTP routes for workouts, mounted at /api/workouts.
// Thin on purpose: read the request, call the service, send the response.
// If the service throws (ValidationError, NotFoundError...), Express 5 passes
// the error to the central error handler automatically, so no try/catch here.
export function createWorkoutRouter(service) {
  const router = Router();

  router.get('/', async (req, res) => {
    const workouts = await service.listWorkouts(req.user.uid);
    res.json({ workouts });
  });

  router.get('/:id', async (req, res) => {
    const workout = await service.getWorkout(req.user.uid, req.params.id);
    res.json({ workout });
  });

  router.post('/', async (req, res) => {
    const workout = await service.createWorkout(req.user.uid, req.body);
    res.status(201).json({ workout });
  });

  router.put('/:id', async (req, res) => {
    const workout = await service.updateWorkout(req.user.uid, req.params.id, req.body);
    res.json({ workout });
  });

  router.delete('/:id', async (req, res) => {
    await service.deleteWorkout(req.user.uid, req.params.id);
    res.status(204).end();
  });

  return router;
}