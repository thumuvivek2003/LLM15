import { useState, useEffect } from 'react';
import { getSummary, patchSummary, recap } from '../api';


export default function MemoryPanel({ threadId }) {
    const [mem, setMem] = useState(null);
    const [editing, setEditing] = useState(false);
    const [notes, setNotes] = useState('');
    const [high, setHigh] = useState('');
    const [msg, setMsg] = useState('');


    async function load() { const m = await getSummary(threadId); setMem(m); setNotes(m?.memory?.notes || m?.notes || ''); setHigh((m?.highlights || []).join('\n')); }
    useEffect(() => { load(); }, [threadId]);


    async function save() { const body = { notes, highlights: high.split(/\n+/).filter(Boolean) }; const m = await patchSummary(threadId, body); setMem(m); setEditing(false); setMsg('Saved'); setTimeout(() => setMsg(''), 1200); }
    async function toggle() { const m = await patchSummary(threadId, { include: !(mem?.include ?? true) }); setMem(m); }
    async function runRecap() { setMsg('Recapping…'); const r = await recap(threadId); setNotes(r.recap); setEditing(true); setMsg(''); }


    return (
        <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>Memory</strong>
                <label style={{ marginLeft: 'auto' }}>
                    <input type="checkbox" checked={mem?.include ?? true} onChange={toggle} /> Include in prompt
                </label>
                <button onClick={() => setEditing(e => !e)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>{editing ? 'Close' : 'Edit'}</button>
                <button onClick={runRecap} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>Recap</button>
            </div>
            {editing ? (
                <>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Notes</div>
                    <textarea rows={8} value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Highlights (one per line)</div>
                    <textarea rows={4} value={high} onChange={e => setHigh(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={save} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#111', color: '#fff' }}>Save</button>
                    </div>
                </>
            ) : (
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{mem?.notes || '—'}</div>
            )}
            {msg && <div style={{ marginTop: 6, opacity: 0.7 }}>{msg}</div>}
        </div>
    );
}