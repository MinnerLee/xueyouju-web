import { courses, topics, getTopic, grade, recommendation } from './courses.js';
import { readState, saveState, emptyState, STORAGE_KEY } from './storage.js';
import { mountChat } from './chat.js';

const main = document.querySelector('main');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const themeToggle = document.querySelector('#theme-toggle');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  themeToggle.textContent = theme === 'dark' ? '☀ 浅色' : '☾ 深色';
}
let savedTheme;
try { savedTheme = storage?.getItem('xueyouju:theme'); } catch { /* storage can be unavailable */ }
setTheme(savedTheme === 'dark' ? 'dark' : 'light');
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { storage?.setItem('xueyouju:theme', theme); } catch { /* keep the current session usable */ }
});
const loaded = readState(storage);
let state = loaded.state;
let storageWarning = loaded.unavailable;
let toastTimer;
let disposeChat = null;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function persist() { if (!saveState(storage, state)) { storageWarning = true; toast('浏览器无法保存记录，本次内容仅在当前页面保留。'); } }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3800); }
function session(id) { return state.sessions[id] ||= { reflection: '', hintLevel: 0, solutionViewed: false, attemptId: null }; }
function latest(id) { return state.attempts.findLast(a => a.topicId === id); }
function tag(text, style = '') { return `<span class="tag ${style}">${text}</span>`; }

function graph() {
  return `<svg class="function-graph" viewBox="0 0 480 300" role="img" aria-label="绝对值函数图像：在原点连续，左右两边斜率不同"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" stroke-opacity=".1"/></pattern></defs><rect width="480" height="300" fill="url(#grid)"/><g fill="none" stroke="#8eaaa1" stroke-width="1"><path d="M40 238H450m-10-5 10 5-10 5M240 275V20m-5 10 5-10 5 10"/></g><path d="M65 63 240 238 415 63" fill="none" stroke="#d9ee99" stroke-width="3.5" stroke-linecap="round"/><circle cx="240" cy="238" r="6" fill="#d9ee99"/><g fill="#d9ee99" font-family="Georgia,serif" font-size="21"><text x="310" y="49">f(x) = |x|</text><text x="248" y="260" font-size="15">0</text><text x="447" y="260" font-size="15">x</text><text x="252" y="29" font-size="15">y</text></g><g font-size="12" fill="#bfd1c8"><text x="57" y="159">左导数 −1</text><text x="331" y="193">右导数 +1</text></g></svg>`;
}

function home() {
  return `<section class="hero wrap"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> 开源助学项目 / V0.2 AI 工作台</div><h1>每一步理解，<br>都有<span class="underline">依据。</span></h1><p class="hero-lead">从一个“为什么”开始。找到课程依据，<br class="desktop-break">沿着提示独立思考，再用一道新题检验理解。</p><div class="hero-actions"><a class="button primary" href="#chat">打开 AI 学习助手 <span>↗</span></a><a class="text-link" href="#about">了解项目 <span>→</span></a></div><div class="hero-note"><span>AI 由后台接入</span><i></i><span>记录保存在本机</span><i></i><span>MIT 开源</span></div></div>
  <div class="hero-board"><div class="board-label"><span>一个值得想清楚的问题</span><span>01 / 数学分析</span></div><h2>连续，就一定可导吗？</h2>${graph()}<div class="board-footer"><span class="evidence-dot">有依据地思考</span><span>定义 → 反例 → 验证</span></div><div class="floating-note"><span>↳</span><div>先看条件，再下结论。<small>换个角度，理解就近了一步。</small></div></div></div></section>
  <section class="process-band"><div class="wrap process"><div><span>01</span><strong>提出疑问</strong><small>从真正困惑的地方开始</small></div><b>→</b><div><span>02</span><strong>找到依据</strong><small>对照定义与适用条件</small></div><b>→</b><div><span>03</span><strong>尝试解释</strong><small>按需要，逐步展开提示</small></div><b>→</b><div><span>04</span><strong>小测复练</strong><small>用新的情境检验理解</small></div></div></section>
  <section class="wrap section"><div class="section-heading"><div><div class="eyebrow">EXPLORE THE COURSES</div><h2>选一门课，从一个问题开始。</h2></div><p>两门课程，一套学习方法。<br>当前开放 6 个自编知识点示例。</p></div><div class="course-grid">${courses.map(c => `<a class="course-card ${c.color}" href="#learn/${topics.find(t => t.courseId === c.id).id}"><div class="course-top"><span class="course-symbol">${c.symbol}</span>${tag('3 个知识点 · 可体验')}</div><div class="eyebrow">${c.en}</div><h3>${c.title}</h3><p>${c.subtitle}</p><div class="course-bottom"><span>${c.chapters}</span><span class="circle-arrow">↗</span></div></a>`).join('')}</div></section>
  <section class="wrap philosophy"><div><div class="eyebrow">LEARN WITH EVIDENCE</div><h2>把“看懂了”，<br>变成“我能解释”。</h2><p>学习不止于看到答案。留下你的思路，让每一次提示和作答都有迹可循。</p><a class="text-link" href="#learn/continuity">体验完整学习流程 →</a></div><ol class="principles"><li><span>01</span><div><h3>解释可以回到出处</h3><p>每个示例都关联自编札记中的具体章节，可以查看完整依据。</p></div></li><li><span>02</span><div><h3>帮助的深度，由你决定</h3><p>从检查条件到关键步骤，三级提示逐层展开，也可以主动查看解析。</p></div></li><li><span>03</span><div><h3>学习记录，有据可查</h3><p>区分独立答对与借助提示完成，给出下一次复练的理由。</p></div></li></ol></section>
  <section class="wrap open-banner"><div><div class="eyebrow">BUILD IN THE OPEN</div><h2>一个持续生长的开源学习项目。</h2><p>已接入 DeepSeek 引导式对话，持续完善课程资料与可核验的反馈。</p></div><a class="button light" href="https://github.com/MinnerLee/xueyouju-web" target="_blank" rel="noopener noreferrer">查看源代码 ↗</a></section>`;
}

function learn(id) {
  const topic = getTopic(id) || topics[0];
  const s = session(topic.id);
  const result = state.attempts.find(a => a.id === s.attemptId);
  const course = courses.find(c => c.id === topic.courseId);
  return `<div class="workspace wrap"><aside class="course-sidebar"><div class="eyebrow">YOUR LEARNING SPACE</div><h2>学习工作台</h2><label class="search-label" for="topic-search">查找知识点</label><div class="search"><span aria-hidden="true">⌕</span><input id="topic-search" placeholder="搜索课程或知识点" type="search"></div><div id="topic-list">${courses.map(c => `<section class="topic-group" data-course="${c.id}"><h3>${c.title}</h3>${topics.filter(t => t.courseId === c.id).map(t => `<a class="topic-link ${t.id === topic.id ? 'selected' : ''}" ${t.id === topic.id ? 'aria-current="page"' : ''} data-search="${c.title} ${t.title} ${t.chapter}" href="#learn/${t.id}"><span class="topic-dot ${latest(t.id) ? 'done' : ''}"></span>${t.title}<span>${t.id === topic.id ? '↗' : latest(t.id) ? '✓' : ''}</span></a>`).join('')}</section>`).join('')}</div><p id="no-topics" hidden>没有匹配的知识点。</p><div class="sidebar-note"><span>✳</span><p>不急着看答案。<br>先给自己的思考一点空间。</p></div><a class="text-link" href="#records">查看学习记录 →</a></aside>
  <section class="learning-main"><div class="breadcrumbs">${course.title}<span>/</span>${topic.chapter}</div><div class="lesson-title"><div><h1>${topic.title}</h1><p>预计 ${topic.time} · 自编固定题库演示</p></div>${tag('可追溯依据', 'green-tag')}</div><div class="demo-notice">此处使用预设问题、固定提示与确定性评分。本页自由思路只作记录；需要对话讲解可打开 <a href="#chat">AI 学习助手 →</a>。</div>${storageWarning ? '<div class="warning" role="status">本地存储不可用或原记录损坏，请及时导出当前记录。</div>' : ''}
  <article class="panel question-panel"><div class="panel-label"><span class="step">01</span> 先想一想</div><h2>${topic.question}</h2>${topic.code ? `<pre><code>${escape(topic.code)}</code></pre>` : ''}<p>${topic.prompt}</p><form id="reflection-form" data-topic="${topic.id}"><label for="reflection">我的思路</label><textarea id="reflection" maxlength="2000" rows="3" placeholder="写下你的判断、理由，或暂时卡住的一步……" ${result ? 'disabled' : ''}>${escape(s.reflection)}</textarea><div class="form-bottom"><small>${s.reflection ? '思路已记录；本演示不自动评价开放回答。' : '先尝试表达，再按需要查看提示。'}</small><button class="button small secondary" ${result ? 'disabled' : ''}>保存思路 ↗</button></div></form></article>
  <article class="panel"><div class="panel-label"><span class="step">02</span> 逐步找线索 <span class="muted">${s.hintLevel} / 3</span></div><div id="hint-content">${s.hintLevel === 0 ? '<p class="muted">卡住很正常。一个小提示，也许就能让你继续。</p>' : topic.hints.slice(0, s.hintLevel).map((h, i) => `<div class="hint"><span>线索 ${String(i + 1).padStart(2, '0')}</span><p>${h}</p></div>`).join('')}</div><div class="hint-actions"><button class="button small secondary" data-action="hint" data-topic="${topic.id}" ${s.hintLevel === 3 || result ? 'disabled' : ''}>${s.hintLevel === 3 ? '三级提示已展开' : '给我一个' + (s.hintLevel ? '更深入的' : '小') + '提示'} <span>＋</span></button><button class="text-button" data-action="solution" data-topic="${topic.id}" ${s.solutionViewed || result ? 'disabled' : ''}>查看完整解析</button></div>${s.solutionViewed ? `<div class="solution"><strong>完整解析</strong><p>${topic.solution}</p></div>` : ''}</article>
  <article class="panel quiz-panel" id="quiz"><div class="panel-label"><span class="step">03</span> 换道题，检验理解</div><form id="quiz-form" data-topic="${topic.id}"><fieldset ${result ? 'disabled' : ''}><legend>${topic.exercise.question}</legend><div class="options">${topic.exercise.options.map((o, i) => `<label class="option ${result && i === result.answerIndex ? result.correct ? 'correct' : 'incorrect' : ''}"><input type="radio" name="answer" value="${i}" required ${result?.answerIndex === i ? 'checked' : ''}><span class="option-letter">${'ABCD'[i]}</span><span>${o}</span></label>`).join('')}</div></fieldset>${!result ? '<button class="button primary small">提交小测 →</button>' : `<div class="feedback ${result.correct ? 'positive' : ''}" role="status"><strong>${result.correct ? '✓ 本次答对了' : '再核对一下条件'}</strong>${result.correct && result.hintLevel === 0 ? tag('★ 独立推导达成（零提示通关）', 'green-tag') : ''}<p>${topic.exercise.explanation}</p><p class="feedback-recommendation">${recommendation(result)}</p></div><div class="result-actions"><button type="button" class="button small secondary" data-action="retry" data-topic="${topic.id}">重新练习</button><a class="text-link" href="#records">查看记录 →</a></div>`}</form></article></section>
  <aside class="evidence-sidebar"><div class="evidence-card"><div class="panel-label">▤ 课程依据 ${tag('原创示例')}</div><h3>${topic.source}</h3><blockquote>${topic.evidence}</blockquote><div class="source-meta"><span>版本</span><strong>v0.1 · 2026-10-29</strong><span>定位</span><strong>${topic.title}</strong><span>来源</span><strong>项目自编学习札记</strong></div><a class="text-link" href="./docs/original-notes.md#${topic.anchor}" target="_blank" rel="noopener">查看来源全文 ↗</a></div><div class="evidence-note"><span>↳</span><p>依据是思考的起点。<br>检查条件，再验证结论。</p></div><div class="session-status"><div class="eyebrow">本次学习</div><p><span>思路记录</span><b>${s.reflection ? '已保存' : '待尝试'}</b></p><p><span>已用提示</span><b>${s.hintLevel} 级</b></p><p><span>小测状态</span><b>${result ? '已完成' : '待作答'}</b></p></div></aside></div>`;
}

function records() {
  const completed = new Set(state.attempts.map(a => a.topicId)).size;
  const independent = state.attempts.filter(a => a.correct && a.hintLevel === 0 && !a.solutionViewed).length;
  return `<section class="wrap records-page"><div class="page-heading"><div><div class="eyebrow">YOUR LEARNING JOURNAL</div><h1>让每次尝试，都留下线索。</h1><p>只记录本机发生的学习过程，单次答对不等于已经掌握。</p></div><div class="records-actions"><button class="button secondary small" data-action="export" ${!state.attempts.length ? 'disabled' : ''}>导出记录 ↓</button><button class="text-button" data-action="clear" ${!state.attempts.length && !Object.keys(state.sessions).length ? 'disabled' : ''}>清空本地数据</button></div></div><div class="stats"><div><span>已练习知识点</span><strong>${completed}<small> / ${topics.length}</small></strong></div><div><span>累计作答</span><strong>${state.attempts.length}<small> 次</small></strong></div><div><span>未用提示且答对</span><strong>${independent}<small> 次</small></strong></div></div>${!state.attempts.length ? `<div class="empty-state"><span class="empty-symbol">✳</span><h2>第一条记录，从一次尝试开始。</h2><p>完成任意小测后，这里会保存你的答案、提示使用和复练建议。</p><a class="button primary" href="#learn/continuity">开始学习 ↗</a></div>` : `<div class="record-list">${[...state.attempts].reverse().map(a => `<article class="record"><div class="record-icon ${a.correct ? 'positive' : ''}">${a.correct ? '✓' : '↺'}</div><div class="record-body"><div class="record-heading"><h2>${getTopic(a.topicId).title}</h2>${tag(a.correct ? a.hintLevel || a.solutionViewed ? '借助提示答对' : '独立答对' : '建议复练')}</div><p>${recommendation(a)}</p><small>${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.date))} · 提示 ${a.hintLevel} 级${a.solutionViewed ? ' · 查看过解析' : ''} · 选择 ${'ABCD'[a.answerIndex]}</small>${a.reflection ? `<details><summary>查看当时的思路</summary><p class="reflection-text">${escape(a.reflection)}</p></details>` : ''}</div><button class="button secondary small" data-action="review" data-topic="${a.topicId}">再练一次 ↗</button></article>`).join('')}</div>`}<div class="privacy-note">记录仅保存在当前浏览器，最多保留 500 次作答。换设备或清理浏览器会丢失记录，可导出 JSON 备份。导出内容包含你写下的思路。</div></section><dialog id="clear-dialog"><h2>清空本地学习数据？</h2><p>将删除这台浏览器里的思路、提示状态和作答记录。建议先导出备份。</p><div class="dialog-actions"><button class="button secondary small" data-action="cancel-clear">取消</button><button class="button primary small" data-action="confirm-clear">确认清空</button></div></dialog>`;
}

function about() {
  return `<section class="wrap about-page"><div class="eyebrow">ABOUT XUEYOUJU</div><h1>以课程依据为起点，<br>让理解有迹可循。</h1><p class="about-lead">学有据是一个围绕课程证据、分层引导与学习反馈展开的助学项目。先跑通具体的学习场景，再逐步验证方法。</p><div class="about-grid"><article class="panel"><h2>当前已经可以体验</h2><ul><li>DeepSeek 后台接入、流式聊天与多会话工作台</li><li>概念讲解、分层提示、检查解答、出题和学习计划</li><li>公式显示、文本资料与 Markdown 笔记导出</li><li>数学分析与 C 语言共 6 个自编知识点</li><li>可定位的原创学习札记</li><li>思路记录、三级提示与完整解析</li><li>选择题小测、确定性评分与本地记录</li><li>JSON 导出、复练建议与数据清理</li></ul></article><article class="panel"><h2>接下来要做的事</h2><ul><li>核验并接入授权课程资料</li><li>扩充目前仅覆盖 6 个自编知识点的课程检索</li><li>增加账号配额及跨设备会话同步</li><li>补充题库、评分规则与教师复核</li><li>通过试用和对照评测检验效果</li></ul></article></div><section class="about-materials"><div class="eyebrow">COURSE MATERIALS</div><h2>数学资料，从目录走向知识点。</h2><p>已接收的教材与练习资料用于本地规划。当前网页尚未检索这些 PDF；页面中的依据均来自项目自编札记。</p><div class="material-row"><span>01</span><div><h3>教材上下册</h3><p>用于建立章节顺序、定义和定理的定位索引。</p></div>${tag('本地资料')}</div><div class="material-row"><span>02</span><div><h3>分类练习册</h3><p>用于对齐课程考点、题型与后续核验流程。</p></div>${tag('待逐题核验')}</div><div class="material-row"><span>03</span><div><h3>补充题册与解析</h3><p>用于拓展练习范围；扫描内容需要 OCR 与公式校对。</p></div>${tag('待整理')}</div><a class="text-link" href="./docs/materials.md" target="_blank" rel="noopener">阅读资料接入说明 ↗</a></section><div class="open-banner"><div><h2>一起把它做成可验证的学习工具。</h2><p>代码与自编示例按 MIT 许可开放，欢迎提交问题和改进。</p></div><a class="button light" href="https://github.com/MinnerLee/xueyouju-web" target="_blank" rel="noopener noreferrer">参与项目 ↗</a></div></section>`;
}

function render(focus = false) {
  disposeChat?.(); disposeChat = null;
  const [page, id] = location.hash.slice(1).split('/');
  const view = ['chat', 'learn', 'records', 'about'].includes(page) ? page : 'home';
  main.innerHTML = view === 'learn' ? learn(id) : view === 'records' ? records() : view === 'about' ? about() : home();
  document.body.dataset.page = view;
  if (view === 'chat') disposeChat = mountChat(main);
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = `${{ home: '每一步理解，都有依据', chat: 'AI 学习助手', learn: '示例练习', records: '学习记录', about: '关于项目' }[view]} · 学有据`;
  if (focus) main.focus({ preventScroll: true });
}

function refreshAt(action) {
  const y = window.scrollY;
  render();
  const target = main.querySelector(`[data-action="${action}"]:not(:disabled)`) || main.querySelector('#quiz') || main;
  if (!target.matches('button')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  window.scrollTo(0, y);
}

main.addEventListener('submit', event => {
  const form = event.target;
  if (!['reflection-form', 'quiz-form'].includes(form.id)) return;
  event.preventDefault();
  const id = form.dataset.topic;
  const s = session(id);
  if (s.attemptId) return;
  if (form.id === 'reflection-form') {
    const text = form.querySelector('textarea').value.trim();
    if (!text) { toast('先写下一点你的思路。'); return; }
    s.reflection = text; persist(); refreshAt('hint'); toast('思路已保存。可以继续思考，或展开提示。');
  } else {
    const answer = new FormData(form).get('answer');
    if (answer === null) return;
    const answerIndex = Number(answer);
    const { correct } = grade(id, answerIndex);
    const reflection = main.querySelector('#reflection')?.value.trim() || s.reflection;
    s.reflection = reflection;
    const attempt = { id: crypto.randomUUID(), topicId: id, answerIndex, correct, hintLevel: s.hintLevel, solutionViewed: s.solutionViewed, reflection, date: new Date().toISOString() };
    state.attempts.push(attempt); state.attempts = state.attempts.slice(-500); s.attemptId = attempt.id;
    persist(); refreshAt('retry'); toast(correct ? '本次答对了，记录已更新。' : '已记录本次尝试，查看解析后再练一次。');
  }
});

main.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  const id = button.dataset.topic;
  if (action === 'hint' || action === 'solution') {
    const s = session(id); if (s.attemptId) return;
    s.reflection = main.querySelector('#reflection')?.value.trim() || s.reflection;
    if (action === 'hint') s.hintLevel = Math.min(3, s.hintLevel + 1); else s.solutionViewed = true;
    persist(); refreshAt('hint'); toast(action === 'hint' ? `已展开第 ${s.hintLevel} 级提示。` : '已展开完整解析，并记录本次使用情况。');
  } else if (action === 'retry' || action === 'review') {
    state.sessions[id] = { reflection: '', hintLevel: 0, solutionViewed: false, attemptId: null }; persist();
    if (location.hash === `#learn/${id}`) { render(true); window.scrollTo(0, 0); } else location.hash = `learn/${id}`;
  } else if (action === 'export') {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'xueyouju-records.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('学习记录已导出。');
  } else if (action === 'clear') document.querySelector('#clear-dialog').showModal();
  else if (action === 'cancel-clear') document.querySelector('#clear-dialog').close();
  else if (action === 'confirm-clear') {
    try { storage.removeItem(STORAGE_KEY); } catch { /* still clear in-memory state */ }
    state = emptyState(); persist(); render(true); toast('本地学习数据已清空。');
  }
});

main.addEventListener('input', event => {
  if (event.target.id === 'reflection') {
    const id = event.target.closest('form').dataset.topic;
    if (!session(id).attemptId) { session(id).reflection = event.target.value; saveState(storage, state); }
  }
  if (event.target.id !== 'topic-search') return;
  const query = event.target.value.trim().toLowerCase();
  let count = 0;
  main.querySelectorAll('.topic-link').forEach(a => { a.hidden = !a.dataset.search.toLowerCase().includes(query); if (!a.hidden) count++; });
  main.querySelectorAll('.topic-group').forEach(group => group.hidden = ![...group.querySelectorAll('.topic-link')].some(a => !a.hidden));
  document.querySelector('#no-topics').hidden = count !== 0;
});

window.addEventListener('hashchange', () => { if (location.hash === '#main') { main.focus(); return; } render(true); window.scrollTo(0, 0); });
render();
