const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Prompts
  getPrompts: () => request('/prompts'),
  getPrompt: (id) => request(`/prompts/${id}`),
  createPrompt: (data) => request('/prompts', { method: 'POST', body: JSON.stringify(data) }),
  updatePrompt: (id, data) => request(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrompt: (id) => request(`/prompts/${id}`, { method: 'DELETE' }),
  duplicatePrompt: (id) => request(`/prompts/${id}/duplicate`, { method: 'POST' }),

  // Runs
  createRun: (data) => request('/run', { method: 'POST', body: JSON.stringify(data) }),
  getRun: (id) => request(`/run/${id}`),
  getRuns: (promptId) => request(`/runs?promptId=${promptId}`),
  streamRun: (id) => new EventSource(`${BASE}/run/${id}/stream`),

  // Validation
  validate: (data) => request('/validate', { method: 'POST', body: JSON.stringify(data) }),

  // Models
  getModels: (refresh) => request(refresh ? '/models?refresh=true' : '/models'),
};
