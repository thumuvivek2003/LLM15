import { useState } from 'react';
import { search, answer, upload } from '../api';


export default function Search() {
    const [q, setQ] = useState('What did the Road Bike specs say about weight?');
    const [useRR, setUseRR] = useState(true);
    const [res, setRes] = useState(null);
    const [ans, setAns] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');


    async function doSearch() { setBusy(true); setMsg(''); setAns(null); try { const r = await search(q, useRR); setRes(r); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }
    async function doAnswer() { setBusy(true); setMsg(''); try { const r = await answer(q, useRR); setAns(r); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }
    async function onUpload(e) { const f = e.target.files[0]; if (!f) return; setMsg('Uploading…'); try { await upload(f); setMsg('Uploaded'); } catch (err) { setMsg('⚠️ ' + (err.message || err)); } }


    return (
        <div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask about your docs…" style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                <button onClick={doSearch} disabled={busy || !q.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd' }}>{busy ? '…' : 'Search'}</button>
                <button onClick={doAnswer} disabled={busy || !q.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Answer</button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <label><input type="checkbox" checked={useRR} onChange={e => setUseRR(e.target.checked)} /> Use LLM re‑ranker</label>
                <label style={{ marginLeft: 'auto' }}>Upload PDF/MD/TXT <input type="file" onChange={onUpload} /></label>
            </div>
            {msg && <div style={{ marginTop: 6, opacity: 0.7 }}>{msg}</div>}


            {res && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>time: {res.timeMs} ms {res.rerankMs ? `(rerank ${res.rerankMs} ms)` : ''}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {res.items.map((it, i) => (
                            <div key={it._id || i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>#{i + 1} · {it.docTitle} p.{it.page} · base={it.baseScore?.toFixed(3)}{it.rerankScore !== undefined ? ` · rr=${it.rerankScore.toFixed(3)}` : ''}</div>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{it.text.slice(0, 400)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {ans && (
                <div style={{ marginTop: 12, border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 700 }}>Answer</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{ans.answer}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Citations: {ans.citations.map(c => `${c.doc} p.${c.page}`).join('; ')}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>gen time: {ans.genMs} ms</div>
                </div>
            )}
        </div>
    );
}