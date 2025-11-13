import { Router } from 'express';
import { z } from 'zod';
import { planWithGemini } from '../llm/planner.js';
import { AGENT_Q, jobOpts } from '../queue.js';


const r = Router();


const PlanSchema = z.object({ goal: z.string().min(4).max(2000) });
r.post('/plan', async (req, res) => {
    try {
        const { goal } = PlanSchema.parse(req.body || {});
        const plan = await planWithGemini({ goal });
        res.json({ plan });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});


const SubmitSchema = z.object({ goal: z.string().min(4), plan: z.object({ steps: z.array(z.any()) }), idempotencyKey: z.string().optional() });
r.post('/submit', async (req, res) => {
    try {
        const { goal, plan, idempotencyKey } = SubmitSchema.parse(req.body || {});
        const idKey = idempotencyKey || `goal:${Buffer.from(goal).toString('base64').slice(0, 40)}`;
        const job = await AGENT_Q.add('run', { goal, plan, input: {} }, jobOpts({ idKey }));
        res.json({ enqueued: true, jobId: job.id });
    } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});


export default r;