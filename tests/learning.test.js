import test from 'node:test';
import assert from 'node:assert/strict';
import { topics, courses, grade, recommendation } from '../src/courses.js';
import { normalizeState, readState, saveState, emptyState } from '../src/storage.js';

test('every topic belongs to a course and has traceable evidence and three hints', () => {
  assert.equal(new Set(topics.map(t => t.id)).size, topics.length);
  for (const topic of topics) {
    assert.ok(courses.some(c => c.id === topic.courseId));
    assert.ok(topic.source && topic.anchor && topic.evidence);
    assert.equal(topic.hints.length, 3);
    assert.ok(topic.exercise.explanation);
  }
});
test('all choices are graded against the declared answer', () => {
  for (const topic of topics) for (let i = 0; i < topic.exercise.options.length; i++) {
    assert.equal(grade(topic.id, i).correct, i === topic.exercise.answer);
  }
});
test('invalid topic and out-of-range answers cannot be graded', () => {
  for (const [id, answer] of [['missing', 0], ['limit', -1], ['limit', 4], ['limit', '2'], ['limit', 1.5]]) {
    assert.throws(() => grade(id, answer));
  }
});
test('seeing a solution counts as assisted even with zero hints', () => {
  assert.match(recommendation({ correct: true, hintLevel: 0, solutionViewed: true }), /借助/);
  assert.match(recommendation({ correct: true, hintLevel: 0, solutionViewed: false }), /独立/);
  assert.match(recommendation({ correct: false, hintLevel: 0, solutionViewed: false }), /核对/);
});
test('malformed storage and disabled storage fail gracefully', () => {
  assert.deepEqual(readState({ getItem() { return '{'; } }).state, emptyState());
  assert.equal(readState(null).unavailable, true);
  assert.equal(saveState(null, emptyState()), false);
  assert.deepEqual(normalizeState({ version: 1, attempts: [null, {}], sessions: { invalid: {} } }), emptyState());
});
test('completed session is preserved across serialization and wrong topic references are dropped', () => {
  const attempt = { id: 'one', topicId: 'limit', answerIndex: 2, correct: true, hintLevel: 1, solutionViewed: false, reflection: '去心邻域', date: '2026-10-29T09:00:00Z' };
  const state = { version: 1, attempts: [attempt], sessions: { limit: { reflection: '去心邻域', hintLevel: 1, solutionViewed: false, attemptId: 'one' }, loop: { attemptId: 'one' } } };
  const loaded = normalizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(loaded.sessions.limit.attemptId, 'one');
  assert.equal(loaded.sessions.loop.attemptId, null);
  assert.deepEqual(loaded.attempts, [attempt]);
});
