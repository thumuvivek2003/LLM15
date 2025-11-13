import { ioEmit } from './sockets.js';
import { tool_webFetch } from './tools/webTool.js';
import { tool_dbQuery } from './tools/dbTool.js';
import { tool_sendEmail } from './tools/emailTool.js';


const TOOL_REGISTRY = {
    web_fetch: tool_webFetch,
    db_query: tool_dbQuery,
    email_send: tool_sendEmail,
};


function safeStepKey(step) {
    // make an idempotency key per step (name+args)
    return JSON.stringify({ name: step.name, tool: step.tool, args: step.args || {} });
}


export async function runPlan(job) {
    const { plan, input } = job.data;
    const ctx = { jobId: job.id, input };
    const results = [];
    for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        const label = step.name || `step_${i + 1}`;


        ioEmit('progress', { jobId: job.id, type: 'start', step: i, label });
        try {
            const tool = TOOL_REGISTRY[step.tool];
            if (!tool) throw new Error('Unknown tool ' + step.tool);


            // idempotency hint: if step is marked idempotent, cache by step key in job data
            const cacheKey = step.idempotent ? safeStepKey(step) : null;
            if (cacheKey && job.data._cache?.[cacheKey]) {
                results.push(job.data._cache[cacheKey]);
                ioEmit('progress', { jobId: job.id, type: 'cached', step: i, label });
                continue;
            }


            const out = await tool({ args: step.args || {}, ctx, prev: results.at(-1) });
            results.push(out);


            if (cacheKey) {
                job.update({ ...job.data, _cache: { ...(job.data._cache || {}), [cacheKey]: out } });
            }


            ioEmit('progress', { jobId: job.id, type: 'done', step: i, label, data: out.preview || out });
        } catch (e) {
            const err = String(e.message || e);
            ioEmit('progress', { jobId: job.id, type: 'error', step: i, label, error: err });
            throw e; // let BullMQ retry according to attempts/backoff
        }
    }
    const result = { ok: true, steps: results, final: results.at(-1) };
    ioEmit('progress', { jobId: job.id, type: 'complete', result });
    return result;
}