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

// New
export async function chatTutor(messages) {
  const res = await api.post('/api/ai/chat', { messages });
  return res.data;
}

export async function analyzeSkillGap(resumeText, targetRole) {
  const res = await api.post('/api/ai/skill-gap', { resume: resumeText, targetRole });
  return res.data;
}

export async function generateMockInterview(role, rounds = 5) {
  const res = await api.post('/api/ai/mock-interview', { role, rounds });
  return res.data;
}

export async function generateFlashcards(topic, count = 10) {
  const res = await api.post('/api/ai/flashcards', { topic, count });
  return res.data;
}

export async function generateCodingExercise(topic) {
  const res = await api.post('/api/ai/coding-exercise', { topic });
  return res.data;
}
