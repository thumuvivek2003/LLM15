import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import docsRouter from './routes/docs.js';
import searchRouter from './routes/search.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));


const limiter = rateLimit({ windowMs: 60*1000, max: 60 });
app.use(limiter);


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/docs', docsRouter);
app.use('/api/search', searchRouter);


const PORT = process.env.PORT || 5055;
await mongoose.connect(process.env.MONGO_URL, { dbName: 'semantic_search' });
console.log('Mongo connected');
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));