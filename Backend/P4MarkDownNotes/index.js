import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import notesRouter from './routes/notes.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));


const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 40, // 40 requests / hour / IP
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/notes', notesRouter);


const PORT = process.env.PORT || 5053;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));