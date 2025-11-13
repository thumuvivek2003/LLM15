import { useState } from 'react';
import { plan, submit } from '../api';


export default function CreateTask({ onEnqueue }) {
    const [goal, setGoal] = useState('Find the latest docs for Node.js 22, save 3 links, and email a summary to me@demo.test');
    const [planJson, setPlanJson] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');


    async function doPlan() { setBusy(true); setMsg(''); try { const p = await plan(goal); setPlanJson(JSON.stringify(p.plan, null, 2)); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }
    async function doSubmit() { try { const p = JSON.parse(planJson); const r = await submit(goal, p); onEnqueue(r.jobId); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } }


    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Describe your task…" style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                <button onClick={doPlan} disabled={busy} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>{busy ? 'Planning…' : 'Plan'}</button>
                <button onClick={doSubmit} disabled={!planJson} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Enqueue</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <textarea rows={14} value={planJson} onChange={e => setPlanJson(e.target.value)} placeholder="Plan JSON will appear here…" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    <b>Tips</b>
                    <ul>
                        <li>Plans are JSON with steps: <code>tool</code>, <code>args</code>, optional <code>idempotent</code></li>
                        <li>Queue uses idempotency via jobId. Re‑enqueueing the same goal will dedupe.</li>
                        <li>Web fetch & DB query are idempotent — set <code>idempotent:true</code>.</li>
                    </ul>
                </div>
            </div>
            {msg && <div style={{ marginTop: 6, opacity: 0.8 }}>{msg}</div>}
        </div>
    );
}