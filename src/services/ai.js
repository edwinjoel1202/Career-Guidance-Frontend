// Small wrapper for ai endpoints if you need them separately (optional)
import api from '../api/axios';

export async function generatePath(domain) {
  const res = await api.post('/api/ai/generate-path', { domain });
  return res.data;
}

export async function generateAssessment(topic) {
  const res = await api.post('/api/ai/generate-assessment', { topic });
  return res.data;
}

export async function evaluateAssessment(topic, submissionJson) {
  const res = await api.post('/api/ai/evaluate-assessment', { topic, submissionJson });
  return res.data;
}
