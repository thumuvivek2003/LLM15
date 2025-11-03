import { useEffect, useState } from 'react';
import { list, createPrompt } from '../api';


export default function Library({ orgId, onOpen }) {
    const [q, setQ] = useState('');
    const [rows, setRows] = useState([]);
    const [msg, setMsg] = useState('');


    async function refresh() { try { setRows(await list(orgId, q)); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } }
    useEffect(() => { refresh(); }, [q, orgId]);


    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title or tag" style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                <button onClick={async () => { const p = await createPrompt({ orgId, title: 'New Prompt', folder: '/', tags: [], variables: [] }); onOpen(p); }} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>New</button>
            </div>
            {rows.map(r => (
                <div key={r._id} onClick={() => onOpen(r)} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, marginBottom: 6, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{r.status} · {r.folder} · tags: {(r.tags || []).join(', ')}</div>
                </div>
            ))}
            {msg && <div style={{ opacity: 0.7 }}>{msg}</div>}
        </div>
    );
}