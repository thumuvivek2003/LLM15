import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import promptRoutes from './routes/prompts.js';


const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/prompts', promptRoutes);


await mongoose.connect(process.env.MONGO_URL, { dbName: 'prompt_library' });
console.log('Mongo connected');


const PORT = Number(process.env.PORT || 5061);
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));