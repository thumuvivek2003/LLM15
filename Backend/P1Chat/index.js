// P1Chat/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// ---------- App setup ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---------- Health check ----------
app.get('/api/P1/health', (_req, res) => res.json({ ok: true, service: 'P1Chat' }));

/**
 * POST /api/P1/chat
 * Body: { messages: [{ role: "user"|"assistant"|"system", content: string }] }
 * Streams text tokens back via Server-Sent Events (SSE).
 *
 * Requirements:
 * - Node 18+ (global fetch)
 * - env: OPENAI_API_KEY
 */
app.post('/api/P1/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
      return;
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a concise, friendly assistant.' },
          ...messages,
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '(no body)');
      res.status(500).json({ error: 'Upstream error', detail: text });
      return;
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    let doneUpstream = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          doneUpstream = true;
          res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
          break;
        }

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        } catch {
          // ignore parse errors on keep-alive / partial lines
        }
      }

      if (doneUpstream) break;
    }

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', detail: String(err) });
    }
  }
});

// ---------- Start server (no conditions) ----------
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`P1Chat server listening on http://localhost:${PORT}`);
});

// (optional) export the app for testing, not required for running
export default app;
