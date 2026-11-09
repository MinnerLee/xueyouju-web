/* ==========================================================================
   全站背景：水下光束循环视频（Pexels 免费授权素材，见 docs/materials.md）
   - 视频固定在最底层，上面压一层主题色遮罩，内容页遮罩更深，保证可读性
   - 减少动态效果 / 省流量 / 用户关闭背景时只显示静态封面
   - 标签页隐藏时暂停，不在后台解码
   ========================================================================== */

const SOURCES = [
  ['./assets/video/tide.webm', 'video/webm'],
  ['./assets/video/tide.mp4', 'video/mp4']
];
const POSTER = './assets/video/tide-poster.jpg';

export function mountVideoBackground() {
  if (document.querySelector('.p-bg')) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  let enabled = true;
  try { enabled = localStorage.getItem('xueyouju:bg') !== 'off'; } catch { /* 默认开 */ }

  const layer = document.createElement('div');
  layer.className = 'p-bg';
  layer.setAttribute('aria-hidden', 'true');
  // 自定义属性里的 url() 按引用它的样式表解析，这里先转成绝对地址
  layer.style.setProperty('--p-poster', `url("${new URL(POSTER, document.baseURI).href}")`);
  const scrim = document.createElement('div');
  scrim.className = 'p-bg-scrim';
  layer.append(scrim);
  document.body.prepend(layer);

  let video = null;
  const ensureVideo = () => {
    if (video) return video;
    video = document.createElement('video');
    video.className = 'p-bg-video';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.poster = POSTER;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    for (const [src, type] of SOURCES) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.append(source);
    }
    // 第一帧解码出来再淡入，避免黑帧闪一下
    video.addEventListener('playing', () => layer.classList.add('is-playing'), { once: true });
    layer.prepend(video);
    return video;
  };

  const canPlay = () => enabled && !reduced && !saveData && !document.hidden;
  const sync = () => {
    layer.classList.toggle('is-off', !enabled);
    if (canPlay()) ensureVideo().play().catch(() => { /* 自动播放被拦截时保留封面 */ });
    else video?.pause();
  };

  document.addEventListener('visibilitychange', sync);
  sync();

  window.__nhBg = {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('xueyouju:bg', enabled ? 'on' : 'off'); } catch { /* ignore */ }
      sync();
      return enabled;
    }
  };
}
