import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import presetsRouter from './routes/presets.js';
import runRouter from './routes/run.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/presets', presetsRouter);
app.use('/api/run', runRouter);


const PORT = process.env.PORT || 5050;


try {
await mongoose.connect(process.env.MONGO_URL, { dbName: 'prompt_playground' });
console.log('MongoDB connected');
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
} catch (err) {
console.error('Mongo connect error', err);
process.exit(1);
}