// utils/embed.js
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

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

export function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const L = Math.min(a.length, b.length);
  for (let i = 0; i < L; i++) {
    const ai = a[i], bi = b[i];
    dot += ai * bi; na += ai * ai; nb += bi * bi;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

/** simple LLM call to answer given retrieved chunks */
export async function answerWithContext({ question, contexts }) {
  // you can tighten instructions as needed
  const contextText = contexts.map((c, i) => `[#${i + 1}] (${c.source})\n${c.text}`).join('\n\n');
  const systemPrompt =
    `You answer strictly from the provided context. 
If the answer is not present, say "I couldn't find that in the provided documents."
Cite sources like [#1] [#2] in your answer.`;

  const userPrompt =
    `Question: ${question}

Context:
${contextText}

Answer with citations:`;

  const resp = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
  });

  // normalize text extraction across SDK versions
  const text = resp?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';

  return (text || '').trim();
}
