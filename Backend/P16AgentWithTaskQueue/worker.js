import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { runPlan } from './worker_run.js';

// ✅ Fix: set maxRetriesPerRequest: null
const connection = new IORedis({ maxRetriesPerRequest: null });
// const connection = new IORedis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null,
// });

await mongoose.connect(process.env.MONGO_URL, { dbName: 'agent_bullmq' });
console.log('Worker connected to Mongo');

new Worker(
  'agent.jobs',
  async (job) => {
    return await runPlan(job);
  },
  {
    connection,
    concurrency: Number(process.env.JOB_CONCURRENCY || 4),
  }
);

console.log('Worker started');
