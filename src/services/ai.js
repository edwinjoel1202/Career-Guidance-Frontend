// src/services/ai.js
import api from '../api/axios';

/* Path & assessment helpers (existing) */
export async function generatePath(domain) {
  const res = await api.post('/api/ai/generate-path', { domain });
  return res.data;
}

export async function generateAssessment(pathIdOrTopic, topicIndexOrNull) {
  // Backends vary; there's an endpoint that expects (pathId, topicIndex) from PathDetails.
  // Provide compatible wrapper:
  if (typeof pathIdOrTopic === 'object') {
    // legacy call with object
    const res = await api.post('/api/ai/generate-assessment', pathIdOrTopic);
    return res.data;
  }
  const res = await api.post('/api/ai/generate-assessment', {
    topic: pathIdOrTopic,
    topicIndex: topicIndexOrNull,
    pathId: null,
  });
  return res.data;
}

export async function evaluateAssessment(pathIdOrObj, topicIndexOrNull, payload) {
  // backend evaluate endpoint earlier expected { topic, submissionJson, assessmentId } or path-specific endpoints.
  // We will support two shapes:
  if (typeof pathIdOrObj === 'object' && pathIdOrObj !== null) {
    // called with a single payload object (legacy)
    const res = await api.post('/api/ai/evaluate-assessment', pathIdOrObj);
    return res.data;
  }
  // If called as (pathId, topicIndex, payload) — many callers call evaluateAssessment(pathId, topicIndex, payload)
  // Normalize to payload expected by your backend path evaluate endpoint if it exists (some controllers return LearningPath).
  try {
    // attempt path-specific endpoint
    const res = await api.post(`/api/paths/${pathIdOrObj}/assessment/evaluate?topicIndex=${topicIndexOrNull}`, payload);
    return res.data;
  } catch (e) {
    // fallback to generic
    const res = await api.post('/api/ai/evaluate-assessment', payload);
    return res.data;
  }
}

/* Chat tutor — now sends a single message object, plus optional sessionId */
export async function chatTutor(messageObj, sessionId = null) {
  // messageObj should be { role: "user", content: "..." }
  const payload = {};
  if (messageObj) payload.message = messageObj;
  if (sessionId) payload.sessionId = sessionId;
  const res = await api.post('/api/ai/chat', payload);
  return res.data;
}

/* Rename a chat session */
export async function renameChatSession(sessionId, newTitle) {
  const res = await api.put(`/api/ai/sessions/${sessionId}`, { title: newTitle });
  return res.data;
}

/* Delete a chat session */
export async function deleteChatSession(sessionId) {
  const res = await api.delete(`/api/ai/sessions/${sessionId}`);
  return res.data;
}

/* Resume / skill gap */
export async function analyzeSkillGap(resumeText, targetRole) {
  const res = await api.post('/api/ai/skill-gap', { resume: resumeText, targetRole });
  return res.data;
}

/* Mock interview generation */
export async function generateMockInterview(role, rounds = 5) {
  const res = await api.post('/api/ai/mock-interview', { role, rounds });
  return res.data;
}

/* Flashcards generation */
export async function generateFlashcards(topic, count = 10) {
  const res = await api.post('/api/ai/flashcards', { topic, count });
  return res.data;
}

export async function generateCodingExercise(topic) {
  const res = await api.post('/api/ai/coding-exercise', { topic });
  return res.data;
}

/* -------------------------
   Convenience GET endpoints (list previously generated items)
   ------------------------- */

export async function getChatSessions() {
  const res = await api.get('/api/ai/sessions');
  return res.data;
}

export async function getChatSession(sessionId) {
  const res = await api.get(`/api/ai/sessions/${sessionId}`);
  return res.data;
}

/* Mock interviews list */
export async function getMockInterviews() {
  const res = await api.get('/api/ai/mock-interviews');
  return res.data;
}

/* Recommendations (resume analyzer results) */
export async function getRecommendations() {
  const res = await api.get('/api/ai/recommendations');
  return res.data;
}

/* Flashcard collections */
export async function getFlashcardCollections() {
  const res = await api.get('/api/ai/flashcards');
  return res.data;
}
