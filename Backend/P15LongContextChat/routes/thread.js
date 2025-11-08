import { Router } from 'express';
import { z } from 'zod';
import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import MemSummary from '../models/MemSummary.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { estimateTokens, clampBudget } from '../util/tokens.js';
import { SYSTEM, buildRecapPrompt, buildUpdateSummaryPrompt, getJsonTextFromCandidates } from '../util/prompts.js';
import { GoogleGenAI } from '@google/genai';


const r = Router();

// Create thread
r.post('/thread', async (_req, res) => {
    const t = await Thread.create({});
    await MemSummary.create({ threadId: t._id });
    res.json({ id: t._id, title: t.title });
});


// Load thread
r.get('/thread/:id', async (req, res) => {
    const tId = req.params.id; const t = await Thread.findById(tId);
    if (!t) return res.status(404).json({ error: 'not found' });
    const msgs = await Message.find({ threadId: tId }).sort({ createdAt: 1 });
    const mem = await MemSummary.findOne({ threadId: tId });
    res.json({ thread: t, messages: msgs, memory: mem });
});

// Toggle / patch summary
const PatchSchema = z.object({ include: z.boolean().optional(), notes: z.string().optional(), highlights: z.array(z.string()).optional() });
r.patch('/thread/:id/summary', async (req, res) => {
    const tId = req.params.id; const body = PatchSchema.parse(req.body || {});
    const mem = await MemSummary.findOneAndUpdate({ threadId: tId }, { $set: body }, { new: true, upsert: true });
    res.json(mem);
});


// Chat
const ChatSchema = z.object({ message: z.string().min(1), useMemory: z.boolean().optional() });
r.post('/thread/:id/chat', async (req, res) => {
    const { message, useMemory = true } = ChatSchema.parse(req.body || {});
    const tId = req.params.id;
    const t = await Thread.findById(tId); if (!t) return res.status(404).json({ error: 'not found' });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

    // Save user message with token guess
    const userMsg = await Message.create({ threadId: tId, role: 'user', content: message, tokenGuess: estimateTokens(message) });


    // Load history + memory
    const all = await Message.find({ threadId: tId }).sort({ createdAt: 1 });
    const mem = await MemSummary.findOne({ threadId: tId });


    // Build prompt parts
    const system = { role: 'user', parts: [{ text: SYSTEM }] };
    const memoryParts = (useMemory && mem?.include && mem?.notes) ? [{ role: 'user', parts: [{ text: 'Memory Notes:\n' + mem.notes + (mem.highlights?.length ? '\nHighlights:\n- ' + mem.highlights.join('\n- ') : '') }] }] : [];
    const budget = Number(process.env.BUDGET_TOKENS || 12000);
    const { context } = clampBudget(all.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }], tokenGuess: m.tokenGuess })), budget);


    const contents = [system, ...memoryParts, ...context];


    const t0 = Date.now();
    const resp = await ai.models.generateContent({
        model: process.env.MODEL || 'gemini-2.0-flash',
        contents,
        generationConfig: { maxOutputTokens: Number(process.env.MAX_TOKENS || 3000) }
    });

    const text = resp.text;
    const ms = Date.now() - t0;

    const asstMsg = await Message.create({ threadId: tId, role: 'assistant', content: text, tokenGuess: estimateTokens(text) });


    // If over budget since last summary update, generate a delta summary
    const turnCount = all.length + 2; // just added user+assistant
    const threshold = budget * 0.8; // trigger when we routinely near budget
    const usedApprox = context.reduce((s, m) => s + (m.tokenGuess || estimateTokens(m.parts?.[0]?.text || '')), 0);
    if (usedApprox > threshold) {
        const since = mem?.lastUpdateTurn || 0;
        const overflow = (await Message.find({ threadId: tId }).sort({ createdAt: 1 })).slice(since);
        const overflowText = overflow.map(m => (m.role.toUpperCase() + ': ' + m.content)).join('\n');


        const updPrompt = buildUpdateSummaryPrompt(mem?.notes || '', overflowText);
        const updResp = await ai.models.generateContent({
            model: process.env.MODEL || 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: updPrompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });
        let j = { notes: mem?.notes || '', highlights: mem?.highlights || [] };
        try {
            let jsonText = getJsonTextFromCandidates(updResp);
            j = JSON.parse(jsonText);
        } catch (e) {
            console.error('Failed to parse JSON from model output:', e);
        }


        await MemSummary.findOneAndUpdate(
            { threadId: tId },
            { $set: { notes: j.notes || mem?.notes || '', highlights: Array.isArray(j.highlights) ? j.highlights : (mem?.highlights || []), lastUpdateTurn: turnCount } },
            { upsert: true }
        );
    }


    res.json({ ok: true, reply: text, latencyMs: ms, messageIds: { user: userMsg._id, assistant: asstMsg._id } });
});


// Recap
r.post('/thread/:id/recap', async (req, res) => {
    const tId = req.params.id;
    const all = await Message.find({ threadId: tId }).sort({ createdAt: 1 });
    const fullText = all.map(m => (m.role.toUpperCase() + ': ' + m.content)).join('\n');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.MODEL || 'gemini-2.0-flash' });
    const prompt = buildRecapPrompt(fullText);
    const resp = await model.generateContent(prompt);
    res.json({ recap: resp.response.text() });
});


export default r;