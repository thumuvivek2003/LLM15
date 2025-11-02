import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import docsRouter from './routes/docs.js';
import chatRouter from './routes/chat.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));


const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/docs', docsRouter);
app.use('/api/chat', chatRouter);


await mongoose.connect(process.env.MONGO_URL, { dbName: 'rag_v2_gemini' });
console.log('Mongo connected');


const PORT = process.env.PORT || 5056;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));