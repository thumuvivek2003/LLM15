import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import http from 'http';
import { initSockets } from './sockets.js';
import agentRoutes from './routes/agent.js';
import jobRoutes from './routes/jobs.js';


const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/agent', agentRoutes);
app.use('/api/jobs', jobRoutes);


const server = http.createServer(app);
initSockets(server);


await mongoose.connect(process.env.MONGO_URL, { dbName: 'agent_bullmq' });
console.log('Mongo connected');


const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, () => console.log(`HTTP+WS on http://localhost:${PORT}`));