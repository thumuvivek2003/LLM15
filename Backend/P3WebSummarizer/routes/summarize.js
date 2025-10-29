import { Router } from 'express';
import { fetchAndExtract } from '../utils/fetchAndExtract.js';
import { chunkText } from '../utils/chunk.js';
import { summarizeChunks } from '../utils/summarizeLLM.js';


const r = Router();


r.post('/', async (req, res) => {
    try {
        const { url, bullets = 7, length = 'medium', includeQuotes = false, model = 'gpt-4o-mini' } = req.body || {};
        if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
        if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Valid url required' });


        const { title, text } = await fetchAndExtract(url);
        if (!text) return res.json({ title, url, summary: 'No main content found.', meta: { chunks: 0, words: 0 } });


        const chunks = chunkText(text);
        const { final, partials } = await summarizeChunks({ chunks, bullets, length, includeQuotes, model });


        const words = text.split(/\s+/).filter(Boolean).length;


        res.json({
            title,
            url,
            summary: final,
            meta: { chunks: chunks.length, words, bullets, length, includeQuotes, model }
        });
    } catch (e) {
        res.status(500).json({ error: String(e.message || e) });
    }
});


export default r;