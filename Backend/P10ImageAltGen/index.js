import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import imagesRouter from './routes/images.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 60 }));


// Static serving of uploaded files (demo only)
app.use('/uploads', express.static('uploads'));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/images', imagesRouter);


await mongoose.connect(process.env.MONGO_URL, { dbName: 'alttext_gemini' });
console.log('Mongo connected');


const PORT = process.env.PORT || 5059;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));