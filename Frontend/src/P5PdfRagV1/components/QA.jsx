import { useState } from 'react';
import Citations from './Citations.jsx';


export default function QA({ onAsk }) {
    const [q, setQ] = useState('');
    const [k, setK] = useState(6);
    const [busy, setBusy] = useState(false);
    const [ans, setAns] = useState('');
    const [cites, setCites] = useState([]);
    const [err, setErr] = useState('');


    async function go() {
        setErr(''); setAns(''); setCites([]);
        if (!q.trim()) return;
        setBusy(true);
        try {
            const res = await onAsk(q, k);
            setAns(res.answer);
            setCites(res.citations);
        } catch (e) { setErr('⚠️ ' + (e.message || String(e))); }
        finally { setBusy(false); }
    }


    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 8 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask about your PDFs…" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
                <label>Top‑K
                    <input type="number" min={1} max={10} value={k} onChange={e => setK(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                </label>
                <button onClick={go} disabled={busy || !q.trim()} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>
                    {busy ? 'Thinking…' : 'Ask'}
                </button>
            </div>
            {err && <div style={{ color: '#b00020', marginTop: 8 }}>{err}</div>}
            {ans && (
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Answer</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{ans}</div>
                    <Citations citations={cites} />
                </div>
            )}
        </div>
    );
}