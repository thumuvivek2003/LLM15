import { Router } from 'express';
import { AGENT_Q } from '../queue.js';


const r = Router();


r.get('/:id', async (req, res) => {
    const job = await AGENT_Q.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'not found' });
    const st = await job.getState();
    const result = await job.getReturnValue().catch(() => null);
    res.json({ id: job.id, state: st, attemptsMade: job.attemptsMade, result });
});


r.post('/:id/retry', async (req, res) => {
    const job = await AGENT_Q.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'not found' });
    await job.retry();
    res.json({ ok: true });
});


export default r;