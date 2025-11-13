import BullMQ from 'bullmq';
import IORedis from 'ioredis';
const { Queue, QueueEvents, Worker, JobsOptions } = BullMQ

const connection = new IORedis({ maxRetriesPerRequest: null });
export const AGENT_Q = new Queue('agent.jobs', { connection });
export const AGENT_Q_EVENTS = new QueueEvents('agent.jobs', { connection });


export function jobOpts({ idKey, retries = Number(process.env.MAX_RETRIES || 2) } = {}) {
    /**
    * idempotency: use jobId derived from idKey; BullMQ prevents duplicates while pending/active/completed.
    */
    const opts = /** @type {JobsOptions} */({
        jobId: idKey, // optional (pass undefined to always enqueue)
        attempts: retries + 1,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: false,
        removeOnFail: false
    });
    return opts;
}