import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { userInputSchema } from './guardrails.ts';
import { runWithTools } from './gemini.ts';


const app = express();
app.use(cors());
app.use(express.json());


const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use(limiter);


app.get('/health', (_req, res) => res.json({ ok: true }));


// Simple, stateless chat: send the latest user message (you can extend to include prior turns)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body || {};
        const parsed = userInputSchema.parse({ message });
        const msgs = Array.isArray(history) ? history : [];
        const convo = [...msgs, { role: 'user', content: parsed.message }];
        const out = await runWithTools(convo);
        res.json(out);
    } catch (e: any) {
        res.status(400).json({ error: String(e.message || e) });
    }
});


const PORT = Number(process.env.PORT || 5057);
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));