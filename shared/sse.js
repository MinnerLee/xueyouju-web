// Incremental SSE decoder: handles split UTF-8 bytes, CRLF, comments and multi-line data.
export async function* readSSE(stream) {
  if (!stream) throw new Error('响应没有数据流');
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '', data = [], event = 'message';
  const parseLine = line => {
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line) { const item = data.length ? { event, data: data.join('\n') } : null; data = []; event = 'message'; return item; }
    if (line.startsWith(':')) return null;
    const colon = line.indexOf(':');
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') data.push(value);
    if (field === 'event') event = value;
    return null;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const item = parseLine(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
        if (item) yield item;
      }
      if (buffer.length > 2_000_000) throw new Error('流式响应块过大');
      if (done) { if (buffer) parseLine(buffer); const item = parseLine(''); if (item) yield item; break; }
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function sseEvent(event, data) { return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
