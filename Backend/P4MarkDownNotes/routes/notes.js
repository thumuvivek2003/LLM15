import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { readUploadedText } from '../utils/readText.js';
import { chunkText } from '../utils/chunk.js';
import { summarizeChunks } from '../utils/summarizeLLM.js';


const r = Router();


const uploadDir = path.join(process.cwd(), 'uploads');


const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const id = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, id + ext);
    }
});


const maxMB = Number(process.env.MAX_FILE_MB || 5);
const upload = multer({
    storage,
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = ['.md', '.markdown', '.txt'].includes(path.extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('Only .md/.markdown/.txt allowed'), ok);
    }
});


r.post('/summarize', upload.single('file'), async (req, res) => {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    const { mode = 'tldr', bullets = 7, length = 'medium', includeQuotes = false, model = 'gpt-4o-mini' } = req.body || {};


    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });


    const tmpPath = req.file.path;
    try {
        const text = await readUploadedText(tmpPath, req.file.originalname);
        if (!text || text.length < 50) {
            return res.json({ summary: 'No meaningful text found.', meta: { chunks: 0, words: 0 } });
        }


        const chunks = chunkText(text);
        const { final, partials } = await summarizeChunks({
            chunks,
            mode,
            bullets: Number(bullets),
            length,
            includeQuotes: String(includeQuotes) === 'true' || includeQuotes === true,
            model
        });


        const words = text.split(/\s+/).filter(Boolean).length;


        res.json({
            file: req.file.originalname,
            summary: final,
            meta: { chunks: chunks.length, words, bullets: Number(bullets), length, mode, includeQuotes: !!includeQuotes, model }
        });
    } catch (e) {
        res.status(500).json({ error: String(e.message || e) });
    } finally {
        // Delete temp file
        fs.unlink(tmpPath).catch(() => { });
    }
});


export default r;