// Client for the Workout Logger API.
// Adds the signed-in user's token to every request and turns error
// responses into ApiError, so the rest of the frontend never deals with fetch.

// Error from the API, carrying the HTTP status code and, for validation
// errors, the list of problems.
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export class ApiClient {
  // getToken: returns the current user's ID token.
  // baseUrl: relative, because nginx forwards /api to the API.
  constructor(getToken, baseUrl = '/api') {
    this.getToken = getToken;
    this.baseUrl = baseUrl;
  }

  // Sends one request; private (#) because only this class should call it.
  async #request(method, path, body) {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null; // success, no content

    // Parse defensively: a proxy error page (e.g. nginx 502) isn't JSON.
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data?.error ?? {};
      throw new ApiError(
        response.status,
        error.message ?? `Request failed (${response.status})`,
        error.details ?? [],
      );
    }
    return data;
  }

  async listWorkouts() {
    const data = await this.#request('GET', '/workouts');
    return data.workouts;
  }

  async getStats() {
    const data = await this.#request('GET', '/workouts/stats');
    return data.stats;
  }

  async createWorkout(workout) {
    const data = await this.#request('POST', '/workouts', workout);
    return data.workout;
  }

  async updateWorkout(id, workout) {
    const data = await this.#request('PUT', `/workouts/${encodeURIComponent(id)}`, workout);
    return data.workout;
  }

  async deleteWorkout(id) {
    await this.#request('DELETE', `/workouts/${encodeURIComponent(id)}`);
  }
}
