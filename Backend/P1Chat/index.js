import express from 'express';

const router = express.Router();

/**
 * POST /api/chat
 * Body: { messages: [{role: "user"|"assistant"|"system", content: string}] }
 * Streams text tokens back to the client in a single HTTP response.
 */
router.post('/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
      return;
    }

    // Prepare upstream request (OpenAI Chat Completions w/ SSE)
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a concise, friendly assistant.' },
          ...messages
        ],
      })
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '(no body)');
      res.status(500).json({ error: 'Upstream error', detail: text });
      return;
    }

    // Setup streaming response
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();

        if (data === '[DONE]') {
          res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
          break;
        }

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        } catch {
          // ignore parse errors on keep-alive lines
        }
      }
    }

    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', detail: String(err) });
    }
  }
});

export default router;
