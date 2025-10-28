export async function streamChat(messages, onDelta) {
  const resp = await fetch('http://localhost:5050/api/P1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => '(no body)');
    throw new Error(`Proxy error: ${text}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });

    // Our server sends lines like: `data: {"delta":"..."}` + \n\n
    let sep;
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const packet = buf.slice(0, sep);
      buf = buf.slice(sep + 2);

      if (packet.startsWith('data:')) {
        const payload = packet.slice(5).trim();
        if (payload) {
          try {
            const { delta } = JSON.parse(payload);
            if (delta) onDelta(delta);
          } catch {
            // ignore bad lines
          }
        }
      }
    }
  }
}
