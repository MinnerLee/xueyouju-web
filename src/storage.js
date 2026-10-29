import { getTopic } from './courses.js';
export const STORAGE_KEY = 'xueyouju:v1';
export function emptyState() { return { version: 1, attempts: [], sessions: {} }; }
export function normalizeState(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.attempts)) return emptyState();
  const attempts = value.attempts.filter(a => a && typeof a.id === 'string' && getTopic(a.topicId) && Number.isInteger(a.answerIndex) && a.answerIndex >= 0 && a.answerIndex < getTopic(a.topicId).exercise.options.length && typeof a.correct === 'boolean' && Number.isInteger(a.hintLevel) && a.hintLevel >= 0 && a.hintLevel <= 3 && typeof a.solutionViewed === 'boolean' && typeof a.reflection === 'string' && Number.isFinite(Date.parse(a.date))).slice(-500);
  const sessions = {};
  for (const [key, s] of Object.entries(value.sessions || {})) {
    if (!getTopic(key) || !s || typeof s !== 'object') continue;
    sessions[key] = { reflection: typeof s.reflection === 'string' ? s.reflection.slice(0, 2000) : '', hintLevel: Number.isInteger(s.hintLevel) ? Math.max(0, Math.min(s.hintLevel, 3)) : 0, solutionViewed: s.solutionViewed === true, attemptId: attempts.some(a => a.id === s.attemptId && a.topicId === key) ? s.attemptId : null };
  }
  return { version: 1, attempts, sessions };
}
export function readState(storage) {
  try { return { state: normalizeState(JSON.parse(storage.getItem(STORAGE_KEY))), unavailable: false }; }
  catch { return { state: emptyState(), unavailable: true }; }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
