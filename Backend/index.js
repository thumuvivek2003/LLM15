import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ChatUI from './P1Chat/index.js';

const app = express();
app.use(cors());
app.use(express.json());

// 👉 Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// 👉 Mount ChatUI routes
app.use('/api/P1', ChatUI); // routes start with /api/chat

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
