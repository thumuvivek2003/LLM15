import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';
import Incident from './models/Incident.js';
import RedTest from './models/RedTest.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { preModerate, postModerate, logIncident } from './guard/pipeline.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 80 }));


app.get('/health', (_req, res) => res.json({ ok: true }));


// 1) Moderation check endpoint
const CheckSchema = z.object({ message: z.string().min(1).max(4000) });
app.post('/api/mod/check', async (req, res) => {
    try {
        const { message } = CheckSchema.parse(req.body || {});
        const pre = await preModerate(message);
        if (pre.action !== 'allow') await logIncident({ stage: 'pre', action: pre.action, categories: pre.categories, severity: pre.severity, original: message, details: { pii: pre.pii || [] } });
        res.json(pre);
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});


// 2) Guarded chat
const ChatSchema = z.object({ message: z.string().min(1).max(4000), history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional() });
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = ChatSchema.parse(req.body || {});
        const pre = await preModerate(message);
        if (pre.action === 'block') {
            await logIncident({ stage: 'pre', action: 'block', categories: pre.categories, severity: pre.severity, original: message, details: { reason: 'precheck' } });
            return res.status(200).json({ blocked: true, reason: pre.categories, suggestion: 'Your message was blocked by policy.' });
        }


        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const sys = [
            `You are a helpful assistant for ${process.env.ORG_NAME}.`,
            'Safety rules: avoid hate, harassment, sexual content involving minors, illegal advice, and sensitive PII. If asked for help with self-harm, respond empathetically and provide help resources.',
            'Refuse or redirect when needed. Keep outputs professional.'
        ].join('\n');




        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });


        // Compose conversation with system
        const contents = [{ role: 'user', parts: [{ text: sys }] }, ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), { role: 'user', parts: [{ text: pre.text }] }];


        let resp = await model.generateContent({ contents, generationConfig: { maxOutputTokens: Number(process.env.MAX_TOKENS || 2048) } });
        let text = resp.response.text();


        // Post moderation
        let post = await postModerate(text);


        // Retry strategy: if post says block, try safe transform once
        if (post.action === 'block') {
            const safePrompt = 'Rewrite the following assistant reply to comply with safety policies. Remove any unsafe content and keep helpfulness: ' + text;
            resp = await model.generateContent(safePrompt);
            text = resp.response.text();
            post = await postModerate(text);
        }


        if (post.action !== 'allow') {
            await logIncident({ stage: 'post', action: post.action, categories: post.categories, severity: post.severity, original: resp.response.text(), details: { after: text, pii: post.pii || [] } });
        }


        res.json({ blocked: false, text: post.text, action: post.action });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


// 3) Red‑team runner
const RunSchema = z.object({ tests: z.array(z.object({ name: z.string(), category: z.string(), prompt: z.string(), expected: z.enum(['allow', 'block']) })) });
app.post('/api/redteam/run', async (req, res) => {
    try {
        const { tests } = RunSchema.parse(req.body || {});
        const rows = [];
        for (const t of tests) {
            const pre = await preModerate(t.prompt);
            const got = pre.action === 'block' ? 'block' : 'allow';
            const pass = got === t.expected;
            rows.push({ ...t, result: got, pass, categories: pre.categories, severity: pre.severity });
        }
        res.json({ rows, passRate: Number((rows.filter(r => r.pass).length / Math.max(1, rows.length)).toFixed(3)) });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});


// 4) Incidents feed
app.get('/api/incidents', async (_req, res) => {
    const items = await Incident.find().sort({ createdAt: -1 }).limit(200);
    res.json(items);
});


await mongoose.connect(process.env.MONGO_URL, { dbName: 'moderation_gemini' });
console.log('Mongo connected');
const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));