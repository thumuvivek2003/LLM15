// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import docsRouter from './routes/docs.js';
import qaRouter from './routes/qa.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 }); // 60 req/min/IP
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/docs', docsRouter);
app.use('/api/qa', qaRouter);

const PORT = process.env.PORT || 5054;
const MONGO_URL = process.env.MONGO_URL;

await mongoose.connect(MONGO_URL, { dbName: 'pdf_rag_v1' });
console.log('MongoDB connected');

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
