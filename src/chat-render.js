import { marked } from '../assets/vendor/marked.esm.js';
import DOMPurify from '../assets/vendor/purify.es.mjs';
import katex from '../assets/vendor/katex.mjs';

export function renderAnswer(text) {
  // Keep math intact while Markdown is parsed; raw HTML is sanitized before insertion.
  const math = [];
  const protectedText = text.replace(/(```[\s\S]*?```|`[^`\n]+`)|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|(?<!\\)\$([^$\n]+?)\$|\\\(([^\n]+?)\\\)/g, (all, code, display, bracket, inline, paren) => {
    if (code) return code;
    const key = `XYJMATHPLACEHOLDER${math.length}END`;
    math.push({ key, value: display ?? bracket ?? inline ?? paren, displayMode: display !== undefined || bracket !== undefined });
    return key;
  });
  let html = DOMPurify.sanitize(marked.parse(protectedText, { breaks: true, gfm: true }), { FORBID_TAGS: ['img', 'iframe', 'style', 'form', 'input', 'video', 'audio'], FORBID_ATTR: ['style', 'target'], ALLOW_DATA_ATTR: false });
  for (const item of math) {
    let rendered;
    try { rendered = katex.renderToString(item.value, { displayMode: item.displayMode, throwOnError: false, trust: false, strict: 'ignore', maxExpand: 1000, output: 'htmlAndMathml' }); } catch { rendered = DOMPurify.sanitize(item.value); }
    html = html.replace(item.key, () => rendered);
  }
  return html;
}
