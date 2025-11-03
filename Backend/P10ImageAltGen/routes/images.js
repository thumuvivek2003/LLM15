import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import ImageDoc from '../models/ImageDoc.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPrompt } from '../utils/prompt.js';
const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
        cb(null, name);
    }
});
const maxMB = Number(process.env.MAX_FILE_MB || 8);
const upload = multer({
    storage,
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype);
        cb(ok ? null : new Error('Only PNG/JPG/WEBP allowed'), ok);
    }
});

const r = Router();


r.get('/', async (_req, res) => {
    const docs = await ImageDoc.find().sort({ createdAt: -1 });
    res.json(docs);
});


r.post('/upload', upload.array('files', 20), async (req, res) => {
    try {
        const files = req.files || [];
        const docs = await ImageDoc.insertMany(files.map(f => ({
            filename: f.filename,
            originalName: f.originalname,
            mimeType: f.mimetype,
            sizeBytes: f.size,
            url: '/uploads/' + f.filename,
            status: 'new'
        })));
        res.json({ ok: true, count: docs.length, ids: docs.map(d => d._id) });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

r.get('/:id', async (req, res) => {
    const doc = await ImageDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json(doc);
});


r.patch('/:id', async (req, res) => {
    const { altText, caption, lang } = req.body || {};
    const doc = await ImageDoc.findByIdAndUpdate(req.params.id, { $set: { altText, caption, lang } }, { new: true });
    res.json(doc);
});


async function fileToBase64(filepath) {
    const b = await fs.readFile(filepath);
    return b.toString('base64');
}


async function generateForDoc(doc, options) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


    // Build prompt & image input
    const prompt = buildPrompt(options);
    const abs = path.join(process.cwd(), 'uploads', doc.filename);
    const b64 = await fileToBase64(abs);
    const imgPart = { inlineData: { data: b64, mimeType: doc.mimeType } };


    const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }, imgPart] }] });
    const text = res.response.text().trim();


    // Expect first line alt text, optional second line starting with Caption:
    let altText = text.split('\n')[0].trim();
    let caption = '';
    const m = text.match(/\nCaption:\s*(.*)$/si);
    if (m) caption = m[1].trim();


    return { altText, caption, raw: text };
}


r.post('/generate', async (req, res) => {
    try {
        if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
        const { ids = [], lang = 'en', length = 'short', includeText = true, extraContext = '' } = req.body || {};
        const maxBatch = Number(process.env.BATCH_MAX || 8);
        const take = ids.slice(0, maxBatch);


        const docs = await ImageDoc.find({ _id: { $in: take } });


        // Mark processing
        await ImageDoc.updateMany({ _id: { $in: take } }, { $set: { status: 'processing', error: null } });


        const results = [];
        for (const d of docs) {
            try {
                const out = await generateForDoc(d, { lang, length, includeText, extraContext });
                const upd = await ImageDoc.findByIdAndUpdate(d._id, { $set: { altText: out.altText, caption: out.caption, lang, status: 'ready' } }, { new: true });
                results.push({ id: d._id, ok: true, altText: upd.altText, caption: upd.caption });
            } catch (e) {
                await ImageDoc.findByIdAndUpdate(d._id, { $set: { status: 'error', error: String(e.message || e) } });
                results.push({ id: d._id, ok: false, error: String(e.message || e) });
            }
        }


        res.json({ ok: true, results, processed: results.length });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


export default r;