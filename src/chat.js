import { courses, topics } from './courses.js';
import { newConversation, readChat, writeChat, historyFor, exportConversation } from './chat-store.js';
import { readSSE } from '../shared/sse.js';
import { renderAnswer } from './chat-render.js';
import { defaultBackendOrigin } from './hosting.js';

const modes = { guide: '引导学习', explain: '概念讲解', review: '检查解答', practice: '针对练习', plan: '学习计划' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage; try { storage = localStorage; } catch {}
let state = readChat(storage);
let settings = { model: 'deepseek-flash', thinking: false };
try { const s = JSON.parse(storage.getItem('xueyouju:connection')); if (s) settings = { model: ['deepseek-flash','deepseek-v4-pro'].includes(s.model) ? s.model : 'deepseek-flash', thinking: s.thinking === true }; } catch {}
let accessToken = ''; // Application access token only, never the DeepSeek key. Never persisted.
let accessError = '', loginAttempt = null;
let contextOpen = false;
let busy = null, root = null, connection = { ok: false, label: '未检测后台', authRequired: false }, renderQueued = false;
const active = () => state.conversations.find(c => c.id === state.activeId);
const save = () => { if (!writeChat(storage, state)) showStatus('浏览器存储不足，当前修改尚未保存，请导出会话。'); };
function showStatus(text) { const el = root?.querySelector('#chat-status'); if (el) el.textContent = text; }
function backendUrl(path) { return defaultBackendOrigin(location) + path; }
function saveSettings() { try { storage.setItem('xueyouju:connection', JSON.stringify(settings)); } catch {} }

function conversationList() { return state.conversations.map(c => `<button class="chat-session ${c.id === state.activeId ? 'active' : ''}" data-chat="select" data-id="${esc(c.id)}"><span>◌</span><span>${esc(c.title)}</span></button>`).join(''); }
function messageHtml(t, i, c) {
  return `<article class="chat-turn" data-turn="${esc(t.id)}"><div class="chat-message user-message"><div class="message-author"><span class="user-avatar">我</span><strong>我的问题</strong><small>${modes[t.mode] || ''}</small></div><div class="user-content">${esc(t.user)}</div></div><div class="chat-message assistant-message"><div class="message-author"><img src="./assets/mark.svg" width="25" height="25" alt=""><strong>学有据</strong><small>${t.status === 'streaming' ? '回答中' : t.status === 'complete' ? '已完成' : t.status === 'error' ? '请求失败' : '已停止'}</small></div><div class="answer-content prose">${t.assistant ? renderAnswer(t.assistant) : `<div class="thinking-placeholder"><span></span>${t.status === 'streaming' ? '正在整理问题与课程依据…' : '还没有收到答案。'}</div>`}</div><div class="turn-notice" ${!t.error && !t.warning ? 'hidden' : ''}>${esc(t.error || t.warning)}</div><div class="message-actions" ${t.status === 'streaming' ? 'hidden' : ''}><button data-chat="copy" data-id="${esc(t.id)}" ${!t.assistant ? 'disabled' : ''}>复制回答</button><button data-chat="note" data-id="${esc(t.id)}" ${!t.assistant ? 'disabled' : ''}>存为笔记</button>${i === c.turns.length - 1 ? `<button data-chat="retry" data-id="${esc(t.id)}" ${busy ? 'disabled' : ''}>重新生成</button>` : ''}<span>${t.usage ? `${t.usage.prompt_tokens + t.usage.completion_tokens} tokens` : ''}</span></div></div></article>`;
}
function accessHtml() {
  return `<section class="ai-access" aria-labelledby="ai-access-title"><div class="ai-access-intro"><div class="eyebrow">AI STUDY / ACCESS</div><h1 id="ai-access-title">先解锁，<br>再一起想清楚。</h1><p>讲清概念，检查思路，拆解难题。<br>你的学习助手，就在这里。</p><div class="ai-access-tags"><span>分层提示</span><span>课程依据</span><span>学习笔记</span></div></div><form id="ai-access-form" class="ai-access-card"><span class="ai-access-index" aria-hidden="true">01 / UNLOCK</span><h2>输入 AI 访问密钥</h2><label for="ai-access-key">访问密钥</label><input id="ai-access-key" name="access-key" type="password" autocomplete="off" maxlength="512" required placeholder="请输入你的访问密钥" aria-describedby="ai-access-help ai-access-error"><p id="ai-access-help">解锁后可直接开始对话。刷新页面后需重新输入。</p><p id="ai-access-error" role="status">${esc(accessError)}</p><button class="button primary" type="submit">解锁学习助手 <span aria-hidden="true">↗</span></button><a href="#learn" class="ai-access-back">先去练习 →</a></form></section>`;
}
function workspaceHtml() {
  const c = active();
  return `<div class="chat-layout ${contextOpen ? 'context-open' : ''}"><aside class="chat-sidebar"><div class="chat-sidebar-title"><span>学习任务</span><small>本机保存</small></div><button class="chat-new" data-chat="new">＋ 新建会话</button><div class="chat-session-list">${conversationList()}</div><div class="chat-sidebar-bottom"><button data-chat="export" ${!c?.turns.length ? 'disabled' : ''}>↓ 导出会话</button><button data-chat="delete">删除当前会话</button><button data-chat="lock">锁定 AI</button><button data-chat="settings">⚙ 模型设置</button></div></aside><section class="chat-main"><header class="chat-toolbar"><div><h1>${esc(c.title)}</h1><p id="backend-status"><span class="connection-dot ${connection.ok ? 'connected' : ''}"></span>${esc(connection.label)}<span> · </span>密钥由后台保管</p></div><div class="toolbar-buttons"><button class="button secondary small" data-chat="lock">锁定 AI</button><button class="button secondary small" data-chat="settings">${esc(settings.model)} <span>⌄</span></button><button class="button secondary small context-toggle" data-chat="context" aria-expanded="${contextOpen}" aria-controls="learning-context">资料与笔记</button></div></header>
  <div class="chat-thread" id="chat-thread" role="log" aria-label="学习对话" aria-live="off">${c.turns.length ? c.turns.map((t,i)=>messageHtml(t,i,c)).join('') : `<div class="chat-welcome"><div class="welcome-mark">✳</div><div class="eyebrow">YOUR LEARNING COMPANION</div><h2>今天，我们一起<br>把哪个问题想清楚？</h2><p>带着题目、你的思路或一段代码来。<br>我会找依据、拆步骤，陪你走到下一步。</p><div class="starter-grid"><button data-chat="starter" data-kind="concept"><span>∂</span><strong>解释一个概念</strong><small>连续和可导，到底差在哪里？</small></button><button data-chat="starter" data-kind="review"><span>✓</span><strong>帮我检查思路</strong><small>找出推导中的第一个问题</small></button><button data-chat="starter" data-kind="practice"><span>↗</span><strong>来一道针对练习</strong><small>换个情境，检验真正的理解</small></button><button data-chat="starter" data-kind="plan"><span>≡</span><strong>安排今天的学习</strong><small>把目标拆成可以完成的步骤</small></button></div></div>`}</div>
  <div class="chat-composer-wrap"><div class="chat-quick-actions"><button data-chat="quick" data-value="请先给我一级提示，不要直接给出完整答案。">给我一个提示</button><button data-chat="quick" data-value="请完整讲解这道题，写清每步所用条件和理由。">完整讲解</button><button data-chat="quick" data-value="请根据刚才的知识点出一道新的练习题，先不要给答案。">换题练习</button></div><form id="chat-form" class="chat-composer"><label class="sr-only" for="chat-input">给学习助手发送消息</label><textarea id="chat-input" rows="3" maxlength="12000" placeholder="输入题目、你的解题思路，或粘贴一段代码…" ${busy ? 'disabled' : ''}>${esc(c.draft)}</textarea><div class="composer-controls"><div><label class="sr-only" for="chat-mode">教学模式</label><select id="chat-mode" ${busy ? 'disabled' : ''}>${Object.entries(modes).map(([k,v])=>`<option value="${k}" ${c.mode===k?'selected':''}>${v}</option>`).join('')}</select><span class="composer-hint">Enter 发送 · Shift+Enter 换行</span></div>${busy ? '<button type="button" class="chat-send stop" data-chat="stop">■ 停止</button>' : '<button class="chat-send" aria-label="发送消息">↑</button>'}</div></form><p id="chat-status" role="status">${busy ? '正在处理…' : '发送时会将本轮对话与资料文字交给后台及 DeepSeek。AI 回答需核验。'}</p></div></section>
  <aside class="chat-context" id="learning-context" aria-label="学习上下文"><div class="context-title"><span>学习上下文</span><button class="context-close" data-chat="close-context" aria-label="关闭资料面板">×</button></div><div class="mobile-session-actions"><button data-chat="export" ${!c?.turns.length ? 'disabled' : ''}>导出会话 ↓</button><button data-chat="delete">删除当前会话</button></div><label for="chat-course">当前课程</label><select id="chat-course" ${busy?'disabled':''}>${[...courses,{id:'general',title:'通用学习'}].map(v=>`<option value="${v.id}" ${c.courseId===v.id?'selected':''}>${v.title}</option>`).join('')}</select><label for="chat-topic">重点知识点</label><select id="chat-topic" ${busy?'disabled':''}><option value="">根据对话查找</option>${topics.filter(t=>c.courseId==='general'||t.courseId===c.courseId).map(t=>`<option value="${t.id}" ${c.topicId===t.id?'selected':''}>${t.title}</option>`).join('')}</select><details open class="context-section"><summary>本轮课程依据 <span id="evidence-count">${c.turns.at(-1)?.evidence?.length||0}</span></summary><div id="chat-evidence">${evidenceHtml(c.turns.at(-1)?.evidence||[])}</div></details><details class="context-section"><summary>补充学习资料</summary><p class="context-help">粘贴或导入你允许交给模型处理的文字。PDF 全文尚未接入。</p><label class="sr-only" for="chat-material">补充资料正文</label><textarea id="chat-material" maxlength="18000" rows="5" placeholder="资料名、章节、相关定义或题目…" ${busy?'disabled':''}>${esc(c.material)}</textarea><label class="upload-text">＋ 导入 .txt / .md<input id="material-file" type="file" accept=".txt,.md,text/plain,text/markdown" ${busy?'disabled':''}></label><small>最多 18000 字，仅保存到本机。</small></details><details class="context-section"><summary>学习偏好</summary><label class="sr-only" for="chat-preferences">学习偏好</label><textarea id="chat-preferences" rows="3" maxlength="1000" placeholder="例如：大一基础，先直观解释，再写严格定义。" ${busy?'disabled':''}>${esc(c.preferences)}</textarea></details><details class="context-section" id="notes-section"><summary>我的学习笔记</summary><label class="sr-only" for="chat-notes">学习笔记</label><textarea id="chat-notes" rows="7" maxlength="20000" placeholder="可把有用的回答存为笔记，再在这里整理。">${esc(c.notes)}</textarea><button class="text-link" data-chat="export-notes">导出笔记 ↓</button></details><div class="context-footer">依据来自已提供的文字片段。<br>不会伪造教材页码或代码运行结果。</div></aside></div>${dialogsHtml()}`;
}
function evidenceHtml(list) { return list.length ? list.map(e=>`<details class="evidence-item"><summary>${esc(e.title)}</summary><p>${esc(e.text)}</p><small>${esc(e.source)} · [E:${esc(e.id)}]</small></details>`).join('') : '<p class="context-help">发出问题后显示实际匹配的原始札记。当前共有 6 个自编知识点，未覆盖整本教材。</p>'; }
function dialogsHtml() {
  return `<dialog class="connection-dialog" id="connection-dialog"><form id="connection-form"><div class="dialog-heading"><h2>模型设置</h2><button type="button" data-chat="close-settings" aria-label="关闭设置">×</button></div><p>已通过访问密钥解锁。需要重新输入时，点击“锁定 AI”。</p><label for="backend-model">模型</label><select id="backend-model"><option value="deepseek-flash" ${settings.model==='deepseek-flash'?'selected':''}>DeepSeek Flash · 日常学习</option><option value="deepseek-v4-pro" ${settings.model==='deepseek-v4-pro'?'selected':''}>DeepSeek V4 Pro · 复杂任务</option></select><label class="thinking-toggle"><input id="backend-thinking" type="checkbox" ${settings.thinking?'checked':''}>启用深度思考（可能需要更长时间）</label><p id="connection-result" role="status"></p><div class="dialog-actions"><button type="button" class="button secondary small" data-chat="test-connection">检测连接</button><button class="button primary small">保存设置</button></div></form></dialog><dialog id="delete-chat-dialog"><h2>删除这个学习会话？</h2><p>会删除本机的该次对话、补充资料和笔记。可以先导出 Markdown。</p><div class="dialog-actions"><button class="button secondary small" data-chat="cancel-delete">取消</button><button class="button primary small" data-chat="confirm-delete">删除会话</button></div></dialog>`;
}
function draw() { if (root?.isConnected) { root.innerHTML = accessToken ? workspaceHtml() : accessHtml(); const thread=root.querySelector('#chat-thread'); if(thread) thread.scrollTop=active().turns.length?thread.scrollHeight:0; } }
function patchStream(c,t) {
  if (renderQueued) return; renderQueued=true;
  requestAnimationFrame(()=>{ renderQueued=false; if (!root?.isConnected || state.activeId!==c.id) return;
    const thread=root.querySelector('#chat-thread'); if(!thread) return; const stick=thread.scrollHeight-thread.scrollTop-thread.clientHeight<110;
    const turn=[...root.querySelectorAll('[data-turn]')].find(el=>el.dataset.turn===t.id);
    if (turn) turn.querySelector('.answer-content').innerHTML=renderAnswer(t.assistant);
    if(stick) thread.scrollTop=thread.scrollHeight;
  });
}
async function checkConnection() {
  try { const response=await fetch(backendUrl('/api/health'),{signal:AbortSignal.timeout(10000)}); const data=await response.json(); if(!response.ok||data.service!=='xueyouju') throw new Error(); connection={ok:data.configured,label:data.configured?'后台已就绪':'后台未配置模型密钥',authRequired:data.authRequired}; }
  catch { connection={ok:false,label:'尚未连接助学后台',authRequired:false}; }
  return connection;
}
function readSettingsForm() {
  settings={model:root.querySelector('#backend-model').value,thinking:root.querySelector('#backend-thinking').checked}; saveSettings();
}
async function unlock(form) {
  if(loginAttempt) return;
  const page=root, input=form.querySelector('#ai-access-key'), button=form.querySelector('button[type="submit"]');
  const token=input.value.trim(); if(!token) return;
  const controller=new AbortController(); loginAttempt=controller;
  button.disabled=true; button.textContent='正在验证…'; input.value='';
  form.querySelector('#ai-access-error').textContent='';
  try {
    const response=await fetch(backendUrl('/api/access'),{method:'POST',headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    let data; try { data=await response.json(); } catch { throw new Error('后台暂时无法连接，请稍后再试。'); }
    if(!response.ok||!data.unlocked) throw new Error(data.error||'密钥验证失败，请重试。');
    if(!data.configured) throw new Error('访问密钥已验证，但后台尚未配置模型，请联系维护者。');
    if(root!==page||!page.isConnected||controller.signal.aborted) return;
    accessToken=token; accessError=''; connection={ok:true,label:'AI 已解锁',authRequired:true};
    draw(); window.scrollTo(0,0); root.querySelector('#chat-input')?.focus({preventScroll:true});
  } catch(error) {
    if(root!==page||!page.isConnected||controller.signal.aborted) return;
    accessError=error.name==='TypeError'?'无法连接助学后台，请检查网络后重试。':error.name==='TimeoutError'?'连接超时，请重试。':error.message;
    draw(); root.querySelector('#ai-access-key')?.focus();
  } finally { if(loginAttempt===controller) loginAttempt=null; }
}
async function send(turnToRetry=null) {
  if(busy||!accessToken) return;
  const c=active(); const text=c.draft.trim();
  if(!turnToRetry&&!text) return;
  if(!turnToRetry&&c.turns.length>=40){showStatus('此会话已达到 40 轮，请新建会话继续。');return;}
  const t=turnToRetry||{id:crypto.randomUUID(),user:text,assistant:'',status:'streaming',mode:c.mode,evidence:[],createdAt:new Date().toISOString()};
  if(!turnToRetry){c.turns.push(t);c.draft='';if(c.turns.length===1)c.title=text.replace(/\s+/g,' ').slice(0,24);}
  t.mode=c.mode;t.assistant='';t.status='streaming';t.error='';t.warning='';t.usage=null;t.evidence=[];
  const controller=new AbortController(); busy={controller,conversationId:c.id}; save(); draw();
  let completed=false, lastSaved=0;
  try {
    const response=await fetch(backendUrl('/api/chat'),{method:'POST',headers:{'Content-Type':'application/json',...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})},body:JSON.stringify({messages:historyFor(c,t),courseId:c.courseId,topicId:c.topicId,mode:c.mode,material:c.material,preferences:c.preferences,model:settings.model,thinking:settings.thinking}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(190000)])});
    if(!response.ok){if(response.status===401){accessToken='';accessError='访问密钥已失效，请重新输入。';}let error;try{error=await response.json();}catch{}throw new Error(error?.error||`后台请求失败（HTTP ${response.status}）。请检查连接设置。`);}
    if(!response.headers.get('content-type')?.includes('text/event-stream'))throw new Error('后台未返回聊天数据流。请稍后重试。');
    for await(const event of readSSE(response.body)){
      const data=JSON.parse(event.data);
      if(event.event==='meta'){t.evidence=data.evidence||[];if(state.activeId===c.id&&root?.isConnected){root.querySelector('#chat-evidence').innerHTML=evidenceHtml(t.evidence);root.querySelector('#evidence-count').textContent=t.evidence.length;}}
      if(event.event==='status')showStatus(data.message);
      if(event.event==='delta'){t.assistant+=data.text;patchStream(c,t);if(Date.now()-lastSaved>1500){save();lastSaved=Date.now();}}
      if(event.event==='error')throw new Error(data.message);
      if(event.event==='done'){completed=true;t.status='complete';t.warning=data.warning||'';t.usage=data.usage;}
    }
    if(!completed)throw new Error('连接提前结束，已保留收到的内容。');
  }catch(error){t.status=controller.signal.aborted?'stopped':'error';t.error=controller.signal.aborted?'已停止生成，可重新生成。':error.name==='TypeError'?'无法连接后台，请检查网络后重试。':error.message;}
  finally{if(busy?.controller===controller)busy=null;save();draw();}
}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function clickHandler(event){
  const button=event.target.closest('[data-chat]');if(!button||button.disabled)return;const action=button.dataset.chat;const c=active();
  if(action==='context'||action==='close-context'){contextOpen=action==='context'?!contextOpen:false;root.querySelector('.chat-layout').classList.toggle('context-open',contextOpen);root.querySelector('.context-toggle').setAttribute('aria-expanded',String(contextOpen));if(contextOpen)root.querySelector('#chat-course').focus();else root.querySelector('.context-toggle').focus();return;}
  if(action==='lock'){busy?.controller.abort();accessToken='';accessError='';draw();root.querySelector('#ai-access-key')?.focus();return;}
  if(action==='stop'){busy?.controller.abort();return;}
  if(['new','select','delete','retry'].includes(action)&&busy){showStatus('请先停止当前生成，再切换任务。');return;}
  if(action==='new'){if(state.conversations.length>=30){showStatus('最多保留 30 个会话，请导出并删除旧会话。');return;}const next=newConversation();state.conversations.unshift(next);state.activeId=next.id;save();draw();}
  if(action==='select'){state.activeId=button.dataset.id;save();draw();}
  if(action==='settings')root.querySelector('#connection-dialog').showModal();
  if(action==='close-settings')root.querySelector('#connection-dialog').close();
  if(action==='test-connection'){try{readSettingsForm();const result=await checkConnection();root.querySelector('#connection-result').textContent=result.label;}catch(e){root.querySelector('#connection-result').textContent=e.message;}}
  if(action==='export')download('学有据-学习对话.md',exportConversation(c));
  if(action==='export-notes')download('学有据-学习笔记.md',c.notes||'# 学习笔记\n');
  if(action==='delete')root.querySelector('#delete-chat-dialog').showModal();
  if(action==='cancel-delete')root.querySelector('#delete-chat-dialog').close();
  if(action==='confirm-delete'){state.conversations=state.conversations.filter(v=>v.id!==c.id);if(!state.conversations.length)state.conversations.push(newConversation());state.activeId=state.conversations[0].id;save();draw();}
  if(action==='retry')await send(c.turns.find(t=>t.id===button.dataset.id));
  if(action==='copy'){try{await navigator.clipboard.writeText(c.turns.find(t=>t.id===button.dataset.id).assistant);showStatus('回答已复制。');}catch{showStatus('浏览器未允许复制，请手动选中文字。');}}
  if(action==='note'){const turn=c.turns.find(t=>t.id===button.dataset.id);c.notes=(c.notes+`\n\n## ${turn.user.slice(0,70)}\n\n`+turn.assistant).slice(-20000);contextOpen=true;save();draw();root.querySelector('#notes-section').open=true;showStatus('已加入本机学习笔记。');}
  if(action==='quick'){c.draft=button.dataset.value;save();root.querySelector('#chat-input').value=c.draft;root.querySelector('#chat-input').focus();}
  if(action==='starter'){
    const prompts={concept:['explain','请解释连续与可导的区别，用一个简单反例帮我理解。'],review:['review','请检查我的解题过程，先指出第一个需要修改的地方。\n题目：\n我的步骤：'],practice:['practice','请给我一道关于连续与可导的练习题，先不要给答案。'],plan:['plan','我今天有 45 分钟复习数学分析中的极限与连续，请给我一份可执行的学习安排。']};
    [c.mode,c.draft]=prompts[button.dataset.kind];save();draw();root.querySelector('#chat-input').focus();
  }
}
function inputHandler(event){const c=active();const map={'chat-input':'draft','chat-material':'material','chat-preferences':'preferences','chat-notes':'notes'};if(map[event.target.id]){c[map[event.target.id]]=event.target.value;save();}}
async function changeHandler(event){const c=active();if(event.target.id==='chat-course'){c.courseId=event.target.value;c.topicId='';save();draw();}if(event.target.id==='chat-topic'){c.topicId=event.target.value;save();}if(event.target.id==='chat-mode'){c.mode=event.target.value;save();}if(event.target.id==='material-file'){const file=event.target.files[0];if(!file)return;if(file.size>150000||!(/\.(txt|md)$/i.test(file.name))){showStatus('请选择小于 150 KB 的 txt 或 md 文件。');return;}const text=await file.text();if(text.length>18000){showStatus('资料超过 18000 字，请选取相关章节。');return;}c.material=`资料：${file.name}\n${text}`.slice(0,18000);save();draw();showStatus('资料已在本机载入，下次发送消息时会提交给后台。');}}
async function submitHandler(event){if(event.target.id==='ai-access-form'){event.preventDefault();await unlock(event.target);return;}if(event.target.id==='chat-form'){event.preventDefault();await send();}if(event.target.id==='connection-form'){event.preventDefault();try{readSettingsForm();await checkConnection();draw();}catch(error){root.querySelector('#connection-result').textContent=error.message;}}}
function keyHandler(event){if(event.target.id==='chat-input'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();send();}}
export function mountChat(element){root=element;if(!state.conversations.length){const c=newConversation();state.conversations.push(c);state.activeId=c.id;}draw();element.addEventListener('click',clickHandler);element.addEventListener('input',inputHandler);element.addEventListener('change',changeHandler);element.addEventListener('submit',submitHandler);element.addEventListener('keydown',keyHandler);checkConnection().then(()=>{if(root===element&&element.isConnected&&!busy){const status=element.querySelector('#backend-status');if(status)status.innerHTML=`<span class="connection-dot ${connection.ok?'connected':''}"></span>${esc(connection.label)} · 密钥由后台保管`;}});return ()=>{loginAttempt?.abort();loginAttempt=null;busy?.controller.abort();element.removeEventListener('click',clickHandler);element.removeEventListener('input',inputHandler);element.removeEventListener('change',changeHandler);element.removeEventListener('submit',submitHandler);element.removeEventListener('keydown',keyHandler);root=null;};}
