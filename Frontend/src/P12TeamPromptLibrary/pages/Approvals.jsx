import { useEffect, useState } from 'react';
import { list, versions, decideVersion } from '../api';


export default function Approvals({ orgId }) {
    const [rows, setRows] = useState([]);
    const [msg, setMsg] = useState('');


    async function refresh() {
        try {
            const items = await list(orgId, '');
            const pending = [];
            for (const p of items) {
                const vs = await versions(p._id, orgId);
                if (vs[0]?.state === 'pending') pending.push({ prompt: p, v: vs[0] });
            }
            setRows(pending);
        } catch (e) { setMsg('⚠️ ' + (e.message || e)); }
    }
    useEffect(() => { refresh(); }, [orgId]);


    async function action(v, decision) { await decideVersion(v._id, decision, decision === 'rejected' ? 'Needs work' : '',orgId); await refresh(); }


    return (
        <div>
            <h3>Approvals</h3>
            {rows.map(({ prompt, v }) => (
                <div key={v._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700 }}>{prompt.title} — v{v.number}</div>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{v.body}</pre>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => action(v, 'approved')} style={{ padding: '6px 10px', border: '1px solid #0a0', borderRadius: 8 }}>Approve</button>
                        <button onClick={() => action(v, 'rejected')} style={{ padding: '6px 10px', border: '1px solid #a00', borderRadius: 8 }}>Reject</button>
                    </div>
                </div>
            ))}
            {msg && <div style={{ opacity: 0.7 }}>{msg}</div>}
        </div>
    );
}