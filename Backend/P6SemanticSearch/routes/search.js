import { Router } from 'express';
import Chunk from '../models/Chunk.js';
import { embedOne } from '../utils/embed_google.js';
import { bestSnippet, addMarks, escapeHtml } from '../utils/highlight.js';


const r = Router();


// If you created a MongoDB Atlas Vector Index, set USE_VECTOR_INDEX=true for fast search
const USE_VECTOR_INDEX = process.env.USE_VECTOR_INDEX === 'true';


async function vectorSearchMongo(queryVec, page, size) {
    const pipeline = [
        {
            $vectorSearch: {
                index: 'embedding_index',
                path: 'embedding',
                queryVector: queryVec,
                numCandidates: Math.max(size * 20, 200),
                limit: size,
            }
        },
        { $addFields: { score: { $meta: 'vectorSearchScore' } } },
        { $project: { text: 1, page: 1, docId: 1, docTitle: 1, score: 1 } }
    ];
    // Mongo doesn't natively paginate inside $vectorSearch; emulate with $skip+$limit by expanding limit
    pipeline[0].$vectorSearch.limit = (page + 1) * size;
    pipeline.splice(1, 0, { $skip: page * size });
    return await Chunk.aggregate(pipeline);
}


function cosine(a, b) { let dot = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; dot += x * y; na += x * x; nb += y * y; } return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10); }


async function vectorSearchApp(queryVec, page, size) {
    const cap = 20000; // safety cap
    const docs = await Chunk.find({}, { text: 1, page: 1, docId: 1, docTitle: 1, embedding: 1 }).limit(cap);
    const scored = docs.map(d => ({ score: cosine(queryVec, d.embedding), ...d.toObject() }))
        .sort((a, b) => b.score - a.score);
    const total = scored.length;
    const slice = scored.slice(page * size, page * size + size);
    return { total, items: slice };
}


r.post('/', async (req, res) => {
    try {
        if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
        const { query, page = 0, size = 10 } = req.body || {};
        if (!query || !String(query).trim()) return res.status(400).json({ error: 'Query required' });


        const qVec = await embedOne(String(query));


        let items = [], total = 0;
        if (USE_VECTOR_INDEX) {
            const agg = await vectorSearchMongo(qVec, Number(page) || 0, Number(size) || 10);
            items = agg; // total unknown, set -1
            total = -1;
        } else {
            const rApp = await vectorSearchApp(qVec, Number(page) || 0, Number(size) || 10);
            items = rApp.items; total = rApp.total;
        }


        // Build highlighted snippets server-side (escape + mark)
        const results = items.map(x => {
            const snippet = addMarks(bestSnippet(x.text, query, 360), query);
            return { id: x._id || undefined, docTitle: x.docTitle, page: x.page, score: Number((x.score || 0).toFixed(4)), snippetHtml: snippet };
        });


        res.json({ results, total });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


export default r;