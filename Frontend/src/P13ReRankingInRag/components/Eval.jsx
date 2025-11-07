import { useState } from 'react';
import { runEval } from '../api';


const SAMPLE = `[
{"id":"q1","q":"helmet safety standards","goldIds":["CHUNK_ID_1","CHUNK_ID_2"]},
{"id":"q2","q":"trail shoes sizing guide","goldIds":["CHUNK_ID_3"]}
]`;


export default function Eval() {
    const [json, setJson] = useState(SAMPLE);
    const [k, setK] = useState(10);
    const [out, setOut] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');


    async function run() {
        try {
            setBusy(true); setMsg('');
            const queries = JSON.parse(json);
            const r = await runEval({ queries, k: Number(k) });
            setOut(r);
        } catch (e) { setMsg('⚠️ ' + (e.message || e)); }
        finally { setBusy(false); }
    }


    return (
        <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={run} disabled={busy} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>{busy ? 'Running…' : 'Run Eval'}</button>
                <label>k <input type="number" value={k} onChange={e => setK(e.target.value)} style={{ width: 80 }} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <textarea value={json} onChange={e => setJson(e.target.value)} rows={14} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                <div>
                    {out ? (
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
                            <div>Recall@{k}: base {out.summary.recBase} → rr {out.summary.recRR}</div>
                            <div>NDCG@{k}: base {out.summary.ndcgBase} → rr {out.summary.ndcgRR}</div>
                            <div style={{ fontWeight: 700, marginTop: 8 }}>Per‑query</div>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                <thead><tr>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}>id</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}>Recall (base→rr)</th>
                                    <th style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: 6 }}>NDCG (base→rr)</th>
                                </tr></thead>
                                <tbody>
                                    {out.rows.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ padding: 6, borderBottom: '1px solid #f6f6f6' }}>{r.id}</td>
                                            <td style={{ padding: 6, borderBottom: '1px solid #f6f6f6' }}>{r.recBase} → {r.recRR}</td>
                                            <td style={{ padding: 6, borderBottom: '1px solid #f6f6f6' }}>{r.ndcgBase} → {r.ndcgRR}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div style={{ opacity: 0.7 }}>Paste a small labeled set and run.</div>}
                </div>
            </div>
            {msg && <div style={{ marginTop: 6, opacity: 0.7 }}>{msg}</div>}
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                Tip: Put actual chunk IDs from Mongo in `goldIds`. You can query them via the DB or by inspecting `/api/search` results and copying the `_id` fields.
            </div>
        </div>
    );
}