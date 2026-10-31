/* ==========================================================================
   NEO BACKGROUND v2 · 「影时间」动态背景（Canvas 2D）
   性能策略：
   - 分辨率按像素预算封顶（高分屏不再线性放大绘制量）
   - 帧率上限 30fps，后台标签页暂停
   - 只在首页持续动画；其它页面只画一帧静态底图
   - 连续掉帧自动降级（减粒子 → 去碎片 → 停动画）
   组成：主题渐变底 + 斜向光带 + 上浮尘埃 + 漂浮碎片 + 月/日晕 + 指针视差
   ========================================================================== */

const PALETTES = {
  light: {
    base: ['#0a74e0', '#015fcc', '#013f8e'],
    beam: 'rgba(255, 255, 255, 0.1)',
    beamSoft: 'rgba(160, 245, 255, 0.07)',
    orb: 'rgba(255, 255, 255, 0.85)',
    orbHalo: 'rgba(180, 245, 255, 0.18)',
    dust: 'rgba(225, 248, 255, 0.65)',
    shade: 'rgba(0, 12, 40, 0.35)'
  },
  dark: {
    base: ['#073579', '#031f64', '#010a26'],
    beam: 'rgba(150, 235, 255, 0.085)',
    beamSoft: 'rgba(90, 200, 255, 0.06)',
    orb: 'rgba(210, 245, 255, 0.7)',
    orbHalo: 'rgba(46, 230, 255, 0.15)',
    dust: 'rgba(140, 225, 255, 0.55)',
    shade: 'rgba(0, 4, 18, 0.45)'
  }
};

const PIXEL_BUDGET = 1600000;
const TARGET_FPS = 30;

function makeGlowSprite(color) {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const base = color.replace(/[\d.]+\)$/, '');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.45, base + '0.26)');
  grad.addColorStop(1, base + '0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function mountNeoBackground() {
  if (document.querySelector('.nh-bg')) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'nh-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = 1;
  let palette = PALETTES.light;
  let baseGradient = null;
  let orbGradient = null;
  let shadeGradient = null;
  let beams = [];
  let particles = [];
  let shards = [];
  let quality = 1;
  let slowFrames = 0;

  const spriteCyan = makeGlowSprite('rgba(170, 240, 255, 0.9)');
  const spritePink = makeGlowSprite('rgba(255, 120, 210, 0.85)');
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const pageIsHome = () => document.body.dataset.page === 'home';
  let enabled = true;
  try { enabled = localStorage.getItem('xueyouju:bg') !== 'off'; } catch { /* 默认开启 */ }

  const buildScene = () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    palette = PALETTES[theme];

    const cssW = Math.max(320, window.innerWidth);
    const cssH = Math.max(320, window.innerHeight);
    width = cssW;
    height = cssH;
    const budgetScale = Math.min(1, Math.sqrt(PIXEL_BUDGET / (cssW * cssH)));
    dpr = Math.min(window.devicePixelRatio || 1, 2) * budgetScale;
    dpr = Math.max(0.5, Math.min(dpr, 2));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    baseGradient = ctx.createRadialGradient(
      cssW * 0.72, cssH * 0.16, 0,
      cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.95
    );
    baseGradient.addColorStop(0, palette.base[0]);
    baseGradient.addColorStop(0.55, palette.base[1]);
    baseGradient.addColorStop(1, palette.base[2]);

    orbGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(cssW, cssH) * 0.42);
    orbGradient.addColorStop(0, palette.orbHalo);
    orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    shadeGradient = ctx.createLinearGradient(0, cssH * 0.72, 0, cssH);
    shadeGradient.addColorStop(0, 'rgba(0,0,0,0)');
    shadeGradient.addColorStop(1, palette.shade);

    const beamCount = quality >= 1 ? 5 : quality >= 0.6 ? 3 : 2;
    beams = Array.from({ length: beamCount }, (_, i) => {
      const bw = Math.max(160, cssW * (0.18 + Math.random() * 0.22));
      const grad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.45, i % 2 ? palette.beamSoft : palette.beam);
      grad.addColorStop(0.62, i % 2 ? palette.beam : palette.beamSoft);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      return {
        x: -cssW * 0.4 + ((i + Math.random() * 0.6) * cssW * 1.25) / beamCount,
        width: bw,
        angle: ((-32 + Math.random() * 6) * Math.PI) / 180,
        speed: 3 + Math.random() * 6,
        alpha: 0.55 + Math.random() * 0.45,
        gradient: grad
      };
    });

    const shardCount = quality >= 1 ? (cssW < 700 ? 4 : 7) : 0;
    shards = Array.from({ length: shardCount }, () => ({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      size: 18 + Math.random() * 46,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.25,
      vy: 2 + Math.random() * 5,
      drift: (Math.random() - 0.5) * 6,
      alpha: 0.05 + Math.random() * 0.07
    }));

    const baseCount = cssW < 700 ? 26 : 58;
    const particleCount = Math.round(baseCount * quality);
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      r: 0.6 + Math.random() * 2.2,
      vy: 3 + Math.random() * 12,
      sway: 0.4 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.4 + Math.random() * 0.9,
      alpha: 0.18 + Math.random() * 0.5,
      pink: Math.random() < 0.12
    }));
  };

  const drawStatic = () => {
    if (!width) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const beam of beams) {
      ctx.save();
      ctx.translate(beam.x, height * 0.5);
      ctx.rotate(beam.angle);
      ctx.globalAlpha = beam.alpha;
      ctx.fillStyle = beam.gradient;
      ctx.fillRect(-beam.width / 2, -height, beam.width, height * 2.4);
      ctx.restore();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(width * 0.78, height * 0.14);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = shadeGradient;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    ctx.restore();
  };

  const draw = (time, dt) => {
    if (!width) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const beam of beams) {
      beam.x += beam.speed * dt;
      if (beam.x - beam.width > width + 80) beam.x = -beam.width - 80;
      ctx.save();
      ctx.translate(beam.x + pointer.x * 12, height * 0.5 + pointer.y * 8);
      ctx.rotate(beam.angle);
      ctx.globalAlpha = beam.alpha;
      ctx.fillStyle = beam.gradient;
      ctx.fillRect(-beam.width / 2, -height, beam.width, height * 2.4);
      ctx.restore();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(width * 0.78 + pointer.x * 16, height * 0.14 + pointer.y * 12);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) * 0.42, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 1 + Math.sin(time * 0.0006) * 0.04;
    ctx.fillStyle = palette.orb;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, 32 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (shards.length) {
      ctx.save();
      for (const s of shards) {
        s.y -= s.vy * dt;
        s.x += s.drift * dt;
        s.rot += s.spin * dt;
        if (s.y < -80) { s.y = height + 60; s.x = Math.random() * width; }
        if (s.x < -80) s.x = width + 60;
        if (s.x > width + 80) s.x = -60;
        ctx.save();
        ctx.translate(s.x + pointer.x * 10, s.y + pointer.y * 8);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.alpha;
        ctx.strokeStyle = palette.dust;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size * 0.62);
        ctx.restore();
      }
      ctx.restore();
    }

    if (particles.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.y -= p.vy * dt;
        p.phase += p.wobble * dt * 2;
        p.x += Math.sin(p.phase) * p.sway * dt * 6;
        if (p.y < -12) { p.y = height + 12; p.x = Math.random() * width; }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        const sprite = p.pink ? spritePink : spriteCyan;
        const size = p.r * 9;
        ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(time * 0.001 + p.phase));
        ctx.drawImage(sprite, p.x + pointer.x * 6 - size / 2, p.y + pointer.y * 4 - size / 2, size, size);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = shadeGradient;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    ctx.restore();
  };

  let raf = 0;
  let lastFrame = 0;
  let lastDraw = 0;
  const frameInterval = 1000 / TARGET_FPS;

  const degrade = () => {
    if (quality > 0.6) quality = 0.6;
    else if (quality > 0.3) quality = 0.3;
    else quality = 0;
    if (quality === 0) {
      stop();
      drawStatic();
      return;
    }
    particles = particles.slice(0, Math.max(8, Math.round(particles.length * 0.6)));
    shards = shards.slice(0, Math.max(0, shards.length - 3));
    beams = beams.slice(0, Math.max(2, beams.length - 1));
  };

  const loop = now => {
    raf = requestAnimationFrame(loop);
    const elapsed = now - lastDraw;
    if (elapsed < frameInterval) return;
    lastDraw = now;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0.016;
    lastFrame = now;
    draw(now, dt);
    if (elapsed > frameInterval * 2.2) slowFrames += 1;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 24) { slowFrames = 0; degrade(); }
  };

  const start = () => {
    if (raf || reduced || quality === 0) return;
    lastFrame = 0;
    lastDraw = 0;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const syncMode = () => {
    if (reduced || !enabled) { stop(); drawStatic(); return; }
    if (!pageIsHome()) { stop(); drawStatic(); return; }
    start();
  };

  buildScene();
  syncMode();

  window.__nhBg = {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('xueyouju:bg', enabled ? 'on' : 'off'); } catch { /* ignore */ }
      syncMode();
      return enabled;
    }
  };

  const onResize = () => { buildScene(); if (!raf) drawStatic(); };
  const onPointer = event => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  const onVisibility = () => { if (document.hidden) stop(); else syncMode(); };
  const onRoute = () => { syncMode(); };
  const themeObserver = new MutationObserver(() => { buildScene(); if (!raf) drawStatic(); });

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('hashchange', onRoute);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return () => {
    stop();
    delete window.__nhBg;
    themeObserver.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('hashchange', onRoute);
    canvas.remove();
  };
}
