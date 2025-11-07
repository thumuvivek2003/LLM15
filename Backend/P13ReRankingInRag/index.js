import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import docsRouter from './routes/docs.js';
import ragRouter from './routes/rag.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 80 }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/docs', docsRouter);
app.use('/api', ragRouter);


await mongoose.connect(process.env.MONGO_URL, { dbName: 'rag_rerank_gemini' });
console.log('Mongo connected');


const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));