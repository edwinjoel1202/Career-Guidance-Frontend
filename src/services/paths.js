import api from '../api/axios';

export async function listPaths() {
  const res = await api.get('/api/paths');
  return res.data;
}

export async function getPath(pathId) {
  const res = await api.get(`/api/paths/${pathId}`);
  return res.data;
}

export async function createPath(domain, pathItems = []) {
  // If pathItems empty array -> backend will generate via AI
  const payload = { domain, path: pathItems };
  const res = await api.post('/api/paths', payload);
  return res.data;
}

export async function updatePath(pathId, path) {
  const res = await api.put(`/api/paths/${pathId}`, { path });
  return res.data;
}

export async function generateAssessment(pathId, topicIndex) {
  const res = await api.post(`/api/paths/${pathId}/assessment?topicIndex=${topicIndex}`);
  return res.data;
}

export async function evaluateAssessment(pathId, topicIndex, submission) {
  // submission expected shape: { topic, answers: [{question, correctAnswer, userAnswer}] }
  const res = await api.post(`/api/paths/${pathId}/assessment/evaluate?topicIndex=${topicIndex}`, submission);
  return res.data;
}

export async function explain(pathId, topicIndex) {
  const res = await api.post(`/api/paths/${pathId}/explain?topicIndex=${topicIndex}`);
  return res.data;
}

export async function resources(pathId, topicIndex) {
  const res = await api.post(`/api/paths/${pathId}/resources?topicIndex=${topicIndex}`);
  return res.data;
}

export async function regenerate(pathId, fromIndex, reason) {
  const res = await api.post(`/api/paths/${pathId}/regenerate`, { fromIndex, reason });
  return res.data;
}
