import { Router } from 'express';
import multer from 'multer';
import Doc from '../models/Doc.js';
import Chunk from '../models/Chunk.js';
import { extractPdfPages } from '../utils/pdfExtract.js';
import { fromBufferToText } from '../utils/readText.js';
import { chunkText } from '../utils/chunk.js';
import { embedMany } from '../utils/embed_google.js';


const r = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: Number(process.env.MAX_FILE_MB || 25) * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = file.mimetype === 'application/pdf' || /text|markdown/.test(file.mimetype) || /\.(md|markdown|txt)$/i.test(file.originalname);
        cb(ok ? null : new Error('Only PDF/MD/TXT allowed'), ok);
    }
});


r.get('/', async (_req, res) => {
    const docs = await Doc.find().sort({ createdAt: -1 });
    res.json(docs);
});


r.delete('/:id', async (req, res) => {
    await Chunk.deleteMany({ docId: req.params.id });
    await Doc.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});


r.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const name = req.file.originalname;
        let pages = [];
        if (req.file.mimetype === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) pages = await extractPdfPages(req.file.buffer);
        else pages = [fromBufferToText(req.file.buffer, name)];


        const title = name.replace(/\.(pdf|md|markdown|txt)$/i, '');
        const doc = await Doc.create({ title, filename: name, pages: pages.length, sizeBytes: req.file.size });


        const all = [];
        pages.forEach((p, pi) => { const cks = chunkText(p); cks.forEach((c, i) => all.push({ docId: doc._id, docTitle: title, page: pi + 1, idx: i, text: c })); });
        const vecs = await embedMany(all.map(x => x.text));
        if (all.length === 0) {
            res.json({ ok: false, error: 'File having no text' });
        }
        const toInsert = all.map((x, i) => ({ ...x, embedding: vecs[i] }));
        await Chunk.insertMany(toInsert);


        res.json({ ok: true, docId: doc._id, title: doc.title, pages: doc.pages, chunks: toInsert.length });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


export default r;