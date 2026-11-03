/** Error from the API, carrying the HTTP status code. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  /**
   * @param {() => Promise<string>} getToken  Returns the current user's ID token.
   * @param {string} baseUrl  Relative: nginx forwards /api to the API.
   */
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
      throw new ApiError(response.status, data?.error ?? `Request failed (${response.status})`);
    }
    return data;
  }

  async listWorkouts() {
    const data = await this.#request('GET', '/workouts');
    return data.workouts;
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

