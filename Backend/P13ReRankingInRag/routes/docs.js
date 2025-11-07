import { Router } from 'express';
import multer from 'multer';
import Doc from '../models/Doc.js';
import Chunk from '../models/Chunk.js';
import { extractPdfPages } from '../utils/pdfExtract.js';
import { fromBufferToText } from '../utils/readText.js';
import { chunkText } from '../utils/chunk.js';
import { embedMany } from '../utils/embed_google.js';


const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });


r.get('/', async (_req, res) => res.json(await Doc.find().sort({ createdAt: -1 })));


r.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'no file' });
        const name = req.file.originalname.toLowerCase();
        let pages = [];
        if (name.endsWith('.pdf')) pages = await extractPdfPages(req.file.buffer);
        else pages = [fromBufferToText(req.file.buffer)];


        const title = name.replace(/\.(pdf|md|markdown|txt)$/i, '');
        const doc = await Doc.create({ title, filename: name, pages: pages.length, sizeBytes: req.file.size });


        const all = [];
        pages.forEach((p, pi) => { const cks = chunkText(p); cks.forEach((c, i) => all.push({ docId: doc._id, docTitle: title, page: pi + 1, idx: i, text: c })); });


        const vecs = await embedMany(all.map(x => x.text));
        await Chunk.insertMany(all.map((x, i) => ({ ...x, embedding: vecs[i] })));


        res.json({ ok: true, docId: doc._id, chunks: all.length });
    } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});


export default r;