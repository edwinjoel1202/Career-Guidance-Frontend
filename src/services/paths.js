// src/services/paths.js
import api from '../api/axios';

/**
 * List all learning paths for current user
 */
export async function listPaths() {
  const res = await api.get('/api/paths');
  return res.data;
}

/**
 * Get a single path by id
 * @param {string|number} pathId
 */
export async function getPath(pathId) {
  const res = await api.get(`/api/paths/${pathId}`);
  return res.data;
}

/**
 * Create a new path
 * If pathItems is an empty array, backend will generate via AI.
 * @param {string} domain
 * @param {Array} pathItems
 */
export async function createPath(domain, pathItems = []) {
  const payload = { domain, path: pathItems };
  const res = await api.post('/api/paths', payload);
  return res.data;
}

/**
 * Update existing path.
 * Accepts either:
 *  - updatePath(pathId, pathArray)  --> sends { path: pathArray }
 *  - updatePath(pathId, payloadObj) --> sends payloadObj as-is (if it contains additional fields)
 */
export async function updatePath(pathId, pathOrPayload) {
  const payload = Array.isArray(pathOrPayload) ? { path: pathOrPayload } : pathOrPayload;
  const res = await api.put(`/api/paths/${pathId}`, payload);
  return res.data;
}

/**
 * Generate assessment (AI)
 * Backend expects POST /api/paths/{pathId}/assessment?topicIndex=#
 */
export async function generateAssessment(pathId, topicIndex = 0) {
  const res = await api.post(`/api/paths/${pathId}/assessment`, null, {
    params: { topicIndex: Number(topicIndex || 0) }
  });
  return res.data;
}

/**
 * Evaluate submission for assessment and return updated LearningPath
 * Backend expects POST /api/paths/{pathId}/assessment/evaluate?topicIndex=#
 * submission shape: { topic, answers: [{ question, correctAnswer, userAnswer }] }
 */
export async function evaluateAssessment(pathId, topicIndex = 0, submission = {}) {
  const res = await api.post(`/api/paths/${pathId}/assessment/evaluate`, submission, {
    params: { topicIndex: Number(topicIndex || 0) }
  });
  return res.data;
}

/**
 * Ask AI to explain a topic
 * Backend expects POST /api/paths/{pathId}/explain?topicIndex=#
 */
export async function explain(pathId, topicIndex = 0) {
  const res = await api.post(`/api/paths/${pathId}/explain`, null, {
    params: { topicIndex: Number(topicIndex || 0) }
  });
  // backend may return { explanation: '...' } or plain string; return res.data for caller to interpret
  return res.data;
}

/**
 * Ask AI for resources for a topic
 * Backend expects POST /api/paths/{pathId}/resources?topicIndex=#
 */
export async function resources(pathId, topicIndex = 0) {
  const res = await api.post(`/api/paths/${pathId}/resources`, null, {
    params: { topicIndex: Number(topicIndex || 0) }
  });
  return res.data;
}

/**
 * Regenerate schedule for a path.
 * Accepts either:
 *  - regenerate(pathId, { fromIndex: 3, reason: 'procrastination' })
 *  - regenerate(pathId, 3, 'procrastination')
 *
 * Always sends { fromIndex, reason } in the POST body to /api/paths/{pathId}/regenerate
 */
export async function regenerate(pathId, payloadOrFromIndex = 0, maybeReason = 'procrastination') {
  let payload = {};

  if (payloadOrFromIndex && typeof payloadOrFromIndex === 'object' && !Array.isArray(payloadOrFromIndex)) {
    payload = {
      fromIndex: Number(payloadOrFromIndex.fromIndex || 0),
      reason: String(payloadOrFromIndex.reason || 'procrastination')
    };
  } else {
    const fromIndex = Number(payloadOrFromIndex || 0);
    const reason = typeof maybeReason === 'string' ? maybeReason : 'procrastination';
    payload = { fromIndex, reason };
  }

  const res = await api.post(`/api/paths/${pathId}/regenerate`, payload);
  return res.data;
}

export default {
  listPaths,
  getPath,
  createPath,
  updatePath,
  generateAssessment,
  evaluateAssessment,
  explain,
  resources,
  regenerate
};
