export const CHAT_KEY = 'xueyouju:chat:v1';
const trim = (value, limit = 12000) => typeof value === 'string' ? value.slice(0, limit) : '';
export function newConversation() {
  return { id: crypto.randomUUID(), title: '新的学习任务', courseId: 'math', mode: 'guide', topicId: '', material: '', preferences: '', notes: '', draft: '', turns: [], createdAt: new Date().toISOString() };
}
export function normalizeChat(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.conversations)) return { version: 1, activeId: null, conversations: [] };
  const conversations = value.conversations.slice(0, 30).filter(c => c && typeof c.id === 'string').map(c => ({
    id: trim(c.id, 100), title: trim(c.title, 60) || '学习任务', courseId: ['math', 'c', 'general'].includes(c.courseId) ? c.courseId : 'math', mode: ['guide', 'explain', 'review', 'practice', 'plan'].includes(c.mode) ? c.mode : 'guide', topicId: trim(c.topicId, 50), material: trim(c.material, 18000), preferences: trim(c.preferences, 1000), notes: trim(c.notes, 20000), draft: trim(c.draft), createdAt: trim(c.createdAt, 50),
    turns: (Array.isArray(c.turns) ? c.turns : []).slice(-40).filter(t => t && typeof t.user === 'string').map(t => ({ id: trim(t.id, 100), user: trim(t.user), assistant: trim(t.assistant, 80000), status: t.status === 'complete' ? 'complete' : t.status === 'error' ? 'error' : 'stopped', error: trim(t.error, 300), warning: trim(t.warning, 300), mode: trim(t.mode, 30), createdAt: trim(t.createdAt, 50), evidence: (Array.isArray(t.evidence) ? t.evidence : []).filter(e => e && typeof e.id === 'string').slice(0,3).map(e => ({ id: trim(e.id,50), title: trim(e.title,100), source: trim(e.source,100), text: trim(e.text,3000), locator: trim(e.locator,200) })), usage: t.usage && Number.isFinite(t.usage.completion_tokens) ? { prompt_tokens: Number(t.usage.prompt_tokens) || 0, completion_tokens: t.usage.completion_tokens } : null })),
  }));
  return { version: 1, activeId: conversations.some(c => c.id === value.activeId) ? value.activeId : conversations[0]?.id || null, conversations };
}
export function readChat(storage) { try { return normalizeChat(JSON.parse(storage.getItem(CHAT_KEY))); } catch { return normalizeChat(null); } }
export function writeChat(storage, state) { try { storage.setItem(CHAT_KEY, JSON.stringify(normalizeChat(state))); return true; } catch { return false; } }
export function historyFor(conversation, currentTurn) {
  const index = conversation.turns.indexOf(currentTurn);
  const previous = conversation.turns.slice(0, index).filter(t => t.status === 'complete' && t.assistant).slice(-10);
  const result = []; let used = currentTurn.user.length;
  for (const turn of previous.reverse()) {
    if (turn.assistant.length > 12000 || used + turn.user.length + turn.assistant.length > 48000) break;
    result.unshift({ role: 'user', content: turn.user }, { role: 'assistant', content: turn.assistant }); used += turn.user.length + turn.assistant.length;
  }
  return [...result, { role: 'user', content: currentTurn.user }];
}
export function exportConversation(c) {
  return `# ${c.title}\n\n课程：${c.courseId}\n\n` + c.turns.map(t => `## 我\n\n${t.user}\n\n## 学有据\n\n${t.assistant || '（未收到回答）'}${t.status !== 'complete' ? '\n\n> 这条回答未正常完成。' : ''}${t.warning ? '\n\n> ' + t.warning : ''}\n`).join('\n') + (c.notes ? `\n## 学习笔记\n\n${c.notes}\n` : '');
}
