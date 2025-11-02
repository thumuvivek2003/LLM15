import Chunk from '../models/Chunk.js';
import Doc from '../models/Doc.js';
import { embedOne } from './embed_google.js';


function cosine(a, b) { let dot = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; dot += x * y; na += x * x; nb += y * y; } return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10); }


export async function rewriteQueries(history, question, n = 3, gen) {
    // gen = GoogleGenerativeAI model for text generation (gemini)
    const prompt = [
        'Rewrite the user question into up to ' + n + ' focused semantic queries that help retrieve facts from a document collection.',
        'Use different facets (names, numbers, sections) when useful. Return as a JSON array of strings only.'
    ].join('\n');
    const hist = (history || []).slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const input = [hist ? ('Conversation:\n' + hist) : '', 'User question: ' + question, prompt].filter(Boolean).join('\n\n');
    const res = await gen.models.generateContent({
        model: "gemini-2.0-flash",
        contents: input,
        config: {
            candidateCount: 1,
            stopSequences: ["x"],
            maxOutputTokens: 20,
            temperature: 1.0,
        },
    });
    const txt = res.text;
    try { const arr = JSON.parse(txt); return (Array.isArray(arr) ? arr : [question]).slice(0, n); } catch { return [question]; }
}


export async function retrieveMulti(queryList, docFilterIds) {
    const k = Number(process.env.RETRIEVE_K || 6);
    // Embed each sub-query
    const embeds = await Promise.all(queryList.map(q => embedOne(q)));
    // Fetch candidate chunks
    const filter = docFilterIds?.length ? { docId: { $in: docFilterIds } } : {};
    const chunks = await Chunk.find(filter, { text: 1, page: 1, docId: 1, docTitle: 1, embedding: 1 }).limit(30000);
    // Score and union top results
    const scoredAll = [];
    for (let qi = 0; qi < embeds.length; qi++) {
        const qv = embeds[qi];
        for (const c of chunks) {
            const s = cosine(qv, c.embedding);
            scoredAll.push({ score: s, text: c.text, page: c.page, docTitle: c.docTitle, docId: c.docId });
        }
    }
    // Deduplicate by text hash-ish
    scoredAll.sort((a, b) => b.score - a.score);
    const seen = new Set();
    const picked = [];
    for (const r of scoredAll) {
        const key = r.docTitle + '|' + r.page + '|' + r.text.slice(0, 80);
        if (!seen.has(key)) { seen.add(key); picked.push(r); }
        if (picked.length >= 5 * k) break;
    }
    return picked.slice(0, k);
}


export function buildContextBlocks(hits, charBudget = 8000) {
    let ctx = ''; const used = [];
    for (const h of hits) {
        const snippet = h.text.replace(/\s+/g, ' ').slice(0, 900);
        const block = `\n\n[Doc: ${h.docTitle} | p.${h.page}]\n${snippet}`;
        if ((ctx.length + block.length) <= charBudget) { ctx += block; used.push({ doc: h.docTitle, page: h.page, snippet }); }
    }
    return { ctx, used };
}