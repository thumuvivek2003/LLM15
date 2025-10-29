import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import summarizeRouter from './routes/summarize.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/summarize', summarizeRouter);


const PORT = process.env.PORT || 5051;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));