import { useState } from 'react';
import CreateTask from './components/CreateTask';
import Progress from './components/Progress';


export default function P16AgentWithTaskQueue() {
    const [jobId, setJobId] = useState(null);
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Agent with Task Queue (Gemini + BullMQ)</h2>
            <CreateTask onEnqueue={setJobId} />
            {jobId && <div style={{ marginTop: 12 }}><Progress jobId={jobId} /></div>}
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Notes: Jobs retry with exponential backoff (attempts = 1 + MAX_RETRIES). Dead letters stay in the queue for inspection.
            </div>
        </div>
    );
}