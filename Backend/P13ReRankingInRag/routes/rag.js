import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Chunk from '../models/Chunk.js';
import { embedOne } from '../utils/embed_google.js';
import { cosine } from '../utils/vec.js';
import { rerankWithGemini } from '../utils/rerank_gemini.js';
import { ndcgAtK, recallAtK } from '../utils/eval.js';


const r = Router();


async function retrieve({ qvec, k = Number(process.env.RETRIEVE_K || 24) }) {
    const chunks = await Chunk.find({}, { text: 1, page: 1, docId: 1, docTitle: 1, embedding: 1 }).limit(25000);
    const scored = chunks.map(c => ({ ...c.toObject(), baseScore: cosine(qvec, c.embedding) }));
    scored.sort((a, b) => b.baseScore - a.baseScore);
    return scored.slice(0, k);
}


r.post('/search', async (req, res) => {
    try {
        const { q, rerank = false } = req.body || {};
        const qvec = await embedOne(String(q || ''));
        const t0 = Date.now();
        const base = await retrieve({ qvec });
        let items = base, rrMs = 0;
        if (rerank) {
            const t1 = Date.now();
            items = await rerankWithGemini({ query: q, candidates: base });
            rrMs = Date.now() - t1;
        }
        const totalMs = Date.now() - t0;
        res.json({ ok: true, items, timeMs: totalMs, rerankMs: rrMs });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


r.post('/answer', async (req, res) => {
    try {
        const { q, rerank = true } = req.body || {};
        const qvec = await embedOne(String(q || ''));
        const base = await retrieve({ qvec, k: Number(process.env.RETRIEVE_K || 24) });
        const hits = rerank ? await rerankWithGemini({ query: q, candidates: base }) : base;
        const use = hits.slice(0, Number(process.env.ANSWER_K || 8));


        const ctx = use.map(h => `[${h.docTitle} p.${h.page}] ${h.text.replace(/\s+/g, ' ').slice(0, 900)}`).join('\n\n');


        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEN_MODEL || 'gemini-1.5-flash' });


        const prompt = [
            'Answer the user using ONLY the context. If missing, say you cannot find it. Cite like [doc - p.X].\n',
            'Context:\n', ctx, '\n\nQuestion: ', q
        ].join('');


        const t0 = Date.now();
        const resp = await model.generateContent(prompt);
        const ms = Date.now() - t0;
        res.json({ ok: true, answer: resp.response.text(), citations: use.map(u => ({ doc: u.docTitle, page: u.page })), genMs: ms });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


// Eval: payload { queries:[{id:string, q:string, goldIds:[chunkId,...]}], k:number, useRerank:boolean }
r.post('/eval/run', async (req, res) => {
    try {
        const { queries = [], k = 10 } = req.body || {};
        const out = [];
        for (const row of queries) {
            const qvec = await embedOne(row.q);
            const base = await retrieve({ qvec, k: Number(process.env.RETRIEVE_K || 24) });
            const reranked = await rerankWithGemini({ query: row.q, candidates: base });
            const ndcgBase = ndcgAtK({ goldIds: row.goldIds || [], ranked: base, k });
            const ndcgRR = ndcgAtK({ goldIds: row.goldIds || [], ranked: reranked, k });
            const recBase = recallAtK({ goldIds: row.goldIds || [], ranked: base, k });
            const recRR = recallAtK({ goldIds: row.goldIds || [], ranked: reranked, k });
            out.push({ id: row.id, ndcgBase, ndcgRR, recBase, recRR });
        }
        const avg = (arr, k) => Number((arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length)).toFixed(4));
        res.json({
            rows: out, summary: {
                ndcgBase: avg(out.map(r => r.ndcgBase)), ndcgRR: avg(out.map(r => r.ndcgRR)),
                recBase: avg(out.map(r => r.recBase)), recRR: avg(out.map(r => r.recRR))
            }
        });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


export default r;