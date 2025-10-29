// routes/docs.js
import { Router } from 'express';
import multer from 'multer';
import Doc from '../models/Doc.js';
import Chunk from '../models/Chunk.js';
import { extractPdfPages } from '../utils/pdfExtract.js';
import { splitIntoChunks } from '../utils/chunk.js';
import { embedMany } from '../utils/embed.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
const router = Router();

/**
 * POST /api/docs/ingest (multipart/form-data)
 * field: file (PDF)
 * optional query: chunkSize, overlap
 */
router.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { buffer, originalname, size } = req.file;
    const { chunkSize = 800, overlap = 120 } = req.query;

    const { pageTexts, totalPages } = await extractPdfPages(buffer);

    const doc = await Doc.create({
      title: originalname,
      filename: originalname,
      pages: totalPages,
      sizeBytes: size,
    });

    // make chunks
    const chunks = [];
    let globalIdx = 0;
    for (let p = 0; p < pageTexts.length; p++) {
      const splits = splitIntoChunks(pageTexts[p], Number(chunkSize), Number(overlap));
      for (const s of splits) {
        chunks.push({
          docId: doc._id,
          page: p + 1,
          idx: globalIdx++,
          text: s.text,
        });
      }
    }

    // embed & insert
    const vectors = await embedMany(chunks.map(c => c.text));
    const docs = chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));
    await Chunk.insertMany(docs, { ordered: false });

    res.json({ ok: true, docId: doc._id, filename: doc.filename, pages: doc.pages, chunks: docs.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/** GET /api/docs/:docId/chunks?limit=20  (debug) */
router.get('/:docId/chunks', async (req, res) => {
  try {
    const { docId } = req.params;
    const limit = Number(req.query.limit || 20);
    const rows = await Chunk.find({ docId }).sort({ idx: 1 }).limit(limit).lean();
    res.json(rows.map(r => ({ page: r.page, idx: r.idx, text: r.text.slice(0, 200) + (r.text.length > 200 ? '…' : '') })));
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

/** GET /api/docs list docs */
router.get('/', async (_req, res) => {
  const docs = await Doc.find().sort({ createdAt: -1 }).lean();
  res.json(docs);
});

export default router;
