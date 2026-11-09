/* ==========================================================================
   全站壳层（只初始化一次）：纸幕转场 + HUD 边框与命令条 + 菜单音效
   柔和版：去掉扫描线 / 颗粒 / 鼠标光斑；音效默认关闭，音色改为正弦波。
   ========================================================================== */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let ready = false;
let sfx = null;

export const playSfx = name => sfx?.[name]?.();

export function initShell() {
  if (ready) return;
  ready = true;
  const isReduced = reduced();

  let wipe = document.querySelector('.nh-wipe');
  const staticWipe = !!wipe;
  if (!wipe) {
    wipe = document.createElement('div');
    wipe.className = 'nh-wipe';
    wipe.setAttribute('aria-hidden', 'true');
    wipe.innerHTML = '<span></span><span></span><span></span>';
    document.body.append(wipe);
  }
  document.body.classList.add('neo');

  /* ---------- HUD：屏幕边框 + 底部命令条 ---------- */
  const frame = document.createElement('div');
  frame.className = 'nh-frame';
  frame.setAttribute('aria-hidden', 'true');
  frame.innerHTML = '<i class="nh-frame-c tl"></i><i class="nh-frame-c tr"></i><i class="nh-frame-c bl"></i><i class="nh-frame-c br"></i><span class="nh-frame-tag">XUEYOUJU // STUDY SESSION</span>';
  const hud = document.createElement('div');
  hud.className = 'nh-hud';
  hud.innerHTML = `
    <div class="nh-hud-top"><strong class="nh-hud-title">View / Explore</strong><span class="nh-hud-sub">Command</span></div>
    <div class="nh-hud-actions">
      <button type="button" class="nh-hud-btn" data-bg-toggle aria-pressed="true"><b aria-hidden="true">◍</b><span class="nh-hud-bg-label">BG ON</span></button>
      <button type="button" class="nh-hud-btn" data-sfx-toggle aria-pressed="false"><b aria-hidden="true">♪</b><span class="nh-hud-sfx-label">SFX OFF</span></button>
      <span class="nh-hud-hint">Ⓐ 打开　Ⓑ 返回</span>
    </div>`;
  document.body.append(frame, hud);

  /* ---------- 菜单音效（WebAudio 合成，无音频文件；默认关闭） ---------- */
  sfx = (() => {
    let ctx = null;
    let armed = false;
    let on = false;
    try { on = localStorage.getItem('xueyouju:sfx') === 'on'; } catch { /* 默认关 */ }
    const arm = () => { armed = true; };
    window.addEventListener('pointerdown', arm, { once: true, passive: true });
    window.addEventListener('keydown', arm, { once: true });
    const ensure = () => {
      if (!armed) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    };
    const tone = (freq, dur, gain, slideTo) => {
      if (!on || isReduced) return;
      const c = ensure();
      if (!c) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    };
    return {
      hover: () => tone(1046, 0.06, 0.012),
      select: () => tone(784, 0.08, 0.02, 988),
      confirm: () => { tone(880, 0.08, 0.022, 1175); window.setTimeout(() => tone(1319, 0.1, 0.016), 60); },
      back: () => tone(587, 0.09, 0.018, 440),
      get on() { return on; },
      toggle() {
        on = !on;
        try { localStorage.setItem('xueyouju:sfx', on ? 'on' : 'off'); } catch { /* ignore */ }
        if (on) { armed = true; tone(880, 0.08, 0.022); }
        return on;
      }
    };
  })();

  const sfxBtn = hud.querySelector('[data-sfx-toggle]');
  const sfxLabel = hud.querySelector('.nh-hud-sfx-label');
  const syncSfx = () => {
    sfxBtn.setAttribute('aria-pressed', String(sfx.on));
    sfxLabel.textContent = sfx.on ? 'SFX ON' : 'SFX OFF';
    sfxBtn.classList.toggle('is-off', !sfx.on);
  };
  syncSfx();
  sfxBtn.addEventListener('click', () => { sfx.toggle(); syncSfx(); });

  // 背景视频开关（低配机器 / 想安静一点可以关掉）
  const bgBtn = hud.querySelector('[data-bg-toggle]');
  const bgLabel = hud.querySelector('.nh-hud-bg-label');
  const syncBg = () => {
    const on = window.__nhBg ? window.__nhBg.enabled : true;
    bgBtn.setAttribute('aria-pressed', String(on));
    bgBtn.classList.toggle('is-off', !on);
    bgLabel.textContent = on ? 'BG ON' : 'BG OFF';
  };
  syncBg();
  bgBtn.addEventListener('click', () => { window.__nhBg?.toggle(); syncBg(); });

  const interactive = 'a, button, .nh-menu-item, .option, .topic-link, summary';
  let lastHover = null;
  document.addEventListener('pointerover', event => {
    const el = event.target.closest(interactive);
    if (!el || el === lastHover) return;
    lastHover = el;
    sfx.hover();
  }, { passive: true });
  document.addEventListener('click', event => {
    if (event.target.closest(interactive)) sfx.confirm();
  }, true);

  /* ---------- 纸幕转场：先把整屏盖实，再换页，最后揭开 ---------- */
  let wiping = false;
  let wipeTimer = 0;
  // 只在大类之间（home / chat / learn / records / about）切换时播纸幕；
  // 同一大类里的子选项（如 learn/limit → learn/loop）直接换内容
  const section = hash => (hash.replace(/^#/, '').split('/')[0] || 'home');
  let currentSection = section(location.hash);

  const reveal = () => {
    window.clearTimeout(wipeTimer);
    wipe.classList.remove('is-held', 'is-covering');
    void wipe.offsetWidth;
    wipe.classList.add('is-revealing');
    document.body.classList.add('nh-enter');
    wipeTimer = window.setTimeout(() => {
      wipe.classList.remove('is-revealing');
      document.body.classList.remove('nh-enter');
      wiping = false;
    }, 460);
  };

  const coverAndGo = hash => {
    if (wiping) return;
    if (isReduced) { location.hash = hash; return; }
    wiping = true;
    window.clearTimeout(wipeTimer);
    document.body.classList.remove('nh-enter');
    wipe.classList.remove('is-revealing', 'is-covering');
    void wipe.offsetWidth;
    wipe.classList.add('is-covering');
    // 覆盖动画 0.36s，留一帧余量再切页（与 theme.css 的 nhCover 对齐）
    wipeTimer = window.setTimeout(() => {
      location.hash = hash;
      requestAnimationFrame(() => requestAnimationFrame(reveal));
    }, 380);
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#main' || href === '#') return;
    const next = href.slice(1);
    if (next === location.hash.slice(1)) return;
    if (section(next) === section(location.hash)) return;
    event.preventDefault();
    document.body.classList.add('nh-instant');
    coverAndGo(next);
  }, true);

  // 前进/后退、直接改 hash：页面已经换了，补一个「揭开」动作
  window.addEventListener('hashchange', () => {
    const previous = currentSection;
    currentSection = section(location.hash);
    if (wiping || isReduced || currentSection === previous) return;
    reveal();
  });

  // 首次进入：从静态幕布揭开（等两帧让内容画好）
  if (staticWipe) {
    if (isReduced) wipe.classList.remove('is-held');
    else requestAnimationFrame(() => requestAnimationFrame(reveal));
  }
}
