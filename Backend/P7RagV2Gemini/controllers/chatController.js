// controllers/chatController.js
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { sanitizeQuestion, SYSTEM_RULES } from '../utils/guardrails.js';
import { rewriteQueries, retrieveMulti, buildContextBlocks } from '../utils/retrieval.js';
import ai from "../ai.js";
/**
 * POST /start
 * Body: { title?: string, docFilterIds?: string[] }
 */
export const startConversation = async (req, res) => {
    try {
        const { title = 'Untitled chat', docFilterIds = [] } = req.body || {};
        const conv = await Conversation.create({ title, docFilterIds });
        res.json({ convId: conv._id, title: conv.title });
    } catch (err) {
        res.status(500).json({ error: err?.message || String(err) });
    }
};

/**
 * POST /stream  (Server-Sent Events)
 * Body: { convId: string, message: string }
 */
export const streamChat = async (req, res) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
    }

    const { convId, message } = req.body || {};
    if (!convId) return res.status(400).json({ error: 'convId is required' });
    if (!message) return res.status(400).json({ error: 'message is required' });

    const conv = await Conversation.findById(convId);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const history = await Message.find({ convId }).sort({ createdAt: 1 }).limit(20);

    // Prepare SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // Utility to emit SSE events
    function send(ev, data) {
      res.write(`event: ${ev}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    const keepAlive = setInterval(() => send('ping', { t: Date.now() }), 20000);
    req.on('close', () => {
      clearInterval(keepAlive);
      try { res.end(); } catch (_) { }
    });

    const q = sanitizeQuestion ? sanitizeQuestion(message) : message;

    const userMsg = await Message.create({ convId, role: 'user', content: q });

    try {
      const chatModelId = process.env.CHAT_MODEL || 'gemini-2.0-flash-001';
      const rewriteCount = Number(process.env.REWRITE_QUERIES || 3);
      const qlist = await rewriteQueries(history, q, rewriteCount, ai);
      send('rewrites', { queries: qlist });

      const hits = await retrieveMulti(qlist, conv.docFilterIds || []);
      const { ctx, used } = buildContextBlocks(hits, 8000);
      send('sources', { citations: used });

      const convo = history.map(m => ({
        role: m.role,
        content: m.content,
      }));

      convo.push({ role: 'user', content: q });

      const userContent = [
        'Context chunks:',
        ctx || '(none)',
        '\n\nQuestion:',
        q,
        '\n\nInstructions: Answer ONLY from context. Cite like [doc:title - p. X]. If unknown, say you cannot find it.',
      ].join('\n');

      const contents = [
        { role: 'user', parts: [{ text: SYSTEM_RULES }] },
        ...convo.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: userContent }] },
      ];

      const stream = await ai.models.generateContentStream({
        model: chatModelId,
        contents,
      });

      let full = '';

      // ✅ Stream "delta" chunks as they arrive
      for await (const chunk of stream) {
        const delta = chunk.text || '';
        if (delta) {
          full += delta;
          send('delta', { delta }); // 🔥 send realtime chunk
        }
      }


      // Save assistant message
      await Message.create({ convId, role: 'assistant', content: full, citations: used });

      send('done', { ok: true });
      clearInterval(keepAlive);
      res.end();

    } catch (modelErr) {
      send('error', { error: String(modelErr?.message || modelErr) });
      clearInterval(keepAlive);
      res.end();
    }
  } catch (outerErr) {
    if (!res.headersSent) {
      return res.status(500).json({ error: outerErr?.message || String(outerErr) });
    }
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: outerErr?.message || String(outerErr) })}\n\n`);
      res.end();
    } catch (_) { }
  }
};

