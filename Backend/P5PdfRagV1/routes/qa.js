// routes/qa.js
import { Router } from 'express';
import Chunk from '../models/Chunk.js';
import Doc from '../models/Doc.js';
import { embedOne, cosineSim, answerWithContext } from '../utils/embed.js';

const router = Router();

/**
 * POST /api/qa/ask
 * body: { query: string, docId?: string, k?: number }
 */
router.post('/ask', async (req, res) => {
  try {
    const { query, docId, k = 6 } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });

    // 1) embed query
    const qvec = await embedOne(query);

    // 2) fetch candidate chunks (naive: all in doc or top N recent; optimize later)
    const filter = docId ? { docId } : {};
    const candidates = await Chunk.find(filter).select('text embedding page docId').lean();

    if (!candidates.length) {
      return res.json({ answer: "No content indexed yet. Please ingest a PDF.", contexts: [] });
    }

    // 3) rank by cosine
    const scored = candidates.map(c => ({
      ...c,
      score: cosineSim(qvec, c.embedding || []),
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(1, Math.min(20, k * 2))); // take a bit more for diversity

    // 4) dedupe by page-ish and take best k
    const seen = new Set();
    const topK = [];
    for (const r of top) {
      const key = `${r.docId}_${r.page}`;
      if (!seen.has(key)) {
        seen.add(key);
        topK.push(r);
      }
      if (topK.length >= k) break;
    }
    // fallback if not enough pages
    while (topK.length < k && topK.length < scored.length) {
      topK.push(scored[topK.length]);
    }

    // 5) build contexts with citations
    // source like: "filename.pdf • p.X"
    const docMap = new Map();
    if (docId) {
      const d = await Doc.findById(docId).lean();
      if (d) docMap.set(String(d._id), d);
    } else {
      const ids = [...new Set(topK.map(t => String(t.docId)))];
      const docs = await Doc.find({ _id: { $in: ids } }).lean();
      for (const d of docs) docMap.set(String(d._id), d);
    }

    const contexts = topK.map(t => {
      const d = docMap.get(String(t.docId));
      const source = d ? `${d.filename} • p.${t.page}` : `doc:${t.docId} • p.${t.page}`;
      return { text: t.text, source };
    });

    // 6) call LLM
    const answer = await answerWithContext({ question: query, contexts });

    res.json({
      answer,
      citations: contexts.map((c, i) => ({ id: i + 1, source: c.source })),
      used: contexts.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

export default router;
