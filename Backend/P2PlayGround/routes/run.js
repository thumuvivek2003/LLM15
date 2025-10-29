import { Router } from 'express';


const r = Router();


// Helper to call OpenAI Chat Completions
async function openaiChat({ model, systemPrompt, userPrompt, temperature, top_p, stream }) {
    const headers = {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const body = {
        model: model || 'gpt-4o-mini',
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        top_p: typeof top_p === 'number' ? top_p : 1,
        messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt || '' }
        ],
        stream: !!stream
    };


    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers, body: JSON.stringify(body)
    });
    return resp;
}

// POST /api/run
// Body: { model, systemPrompt, userPrompt, temperature, top_p }
// Optional: ?stream=1 for SSE
r.post('/', async (req, res) => {
    const { model, systemPrompt, userPrompt, temperature, top_p } = req.body || {};
    const wantStream = String(req.query.stream || '') === '1';


    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }


    const upstream = await openaiChat({ model, systemPrompt, userPrompt, temperature, top_p, stream: wantStream });


    if (!upstream.ok) {
        const text = await upstream.text().catch(() => '(no body)');
        return res.status(500).json({ error: 'Upstream error', detail: text });
    }


    if (!wantStream) {
        const json = await upstream.json();
        const content = json.choices?.[0]?.message?.content || '';
        return res.json({ content, raw: json });
    }


    // Streaming (SSE-like)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');


    if (!upstream.body) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'No body' })}\n\n`);
        return res.end();
    }


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
                res.write(`event: done\ndata: {"done":true}\n\n`);
                break;
            }
            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content || '';
                if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            } catch {
                // ignore
            }
        }
    }


    res.end();
});


export default r;