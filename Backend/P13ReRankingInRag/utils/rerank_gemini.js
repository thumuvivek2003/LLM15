import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


/**
* LLM re-ranker (cross-encoder style): ask Gemini to score each candidate for relevance 0..1.
* We send a single prompt with the query + numbered snippets, and request a JSON array of scores.
*/
export async function rerankWithGemini({ query, candidates }) {
    const model = genAI.getGenerativeModel({ model: process.env.GEN_MODEL || 'gemini-1.5-flash' });
    const guidance = [
        'You are a retrieval re-ranker. Given a user query and N text candidates, output a JSON array of length N with relevance scores between 0.0 and 1.0.',
        'Scoring rubric: 1.0 = directly answers or contains key facts; 0.7 = strongly relevant; 0.4 = tangential; 0.0 = irrelevant.',
        'Do not add explanations. Return JSON only.'
    ].join('\n');


    const numbered = candidates.map((c, i) => `[${i}] ${c.text.slice(0, 600).replace(/\s+/g, ' ')}`).join('\n');
    const prompt = `${guidance}\n\nQuery: ${query}\nCandidates:\n${numbered}`;


    const resp = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: { type: 'ARRAY', items: { type: 'NUMBER' } }
        }
    });
    let scores = []; try { scores = JSON.parse(resp.response.text()); } catch { scores = new Array(candidates.length).fill(0.5); }
    // zip & sort
    const out = candidates.map((c, i) => ({ ...c, rerankScore: Number(scores[i] || 0) }));
    out.sort((a, b) => b.rerankScore - a.rerankScore);
    return out;
}