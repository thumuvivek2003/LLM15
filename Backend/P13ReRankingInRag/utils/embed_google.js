// utils/embed.js
import { GoogleGenAI } from '@google/genai';



const MODEL = process.env.EMBED_MODEL || 'gemini-embedding-001';
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

export const ai = new GoogleGenAI({ apiKey });

/** embed a single text -> number[] */
export async function embedOne(text) {
    const resp = await ai.models.embedContent({
        model: MODEL,
        contents: text,
    });
    const vec =
        resp?.embedding?.values ??
        resp?.embeddings?.[0]?.values ??
        resp?.embeddings?.values;
    if (!Array.isArray(vec) || !vec.every((x) => typeof x === 'number')) {
        throw new Error('Embedding vector missing or not numeric');
    }
    return vec;
}

/** embed many texts -> number[][] (batched parallel) */
export async function embedMany(texts, { concurrency = 16 } = {}) {
    const out = [];
    let i = 0;
    while (i < texts.length) {
        const batch = texts.slice(i, i + concurrency);
        const res = await Promise.all(batch.map((t) => embedOne(t)));
        out.push(...res);
        i += concurrency;
    }
    return out;
}
