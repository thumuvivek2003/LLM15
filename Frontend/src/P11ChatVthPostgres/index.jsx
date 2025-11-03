import { useEffect, useState } from 'react';
import { getSchema, ask, search, embedAll } from './api';


function Table({ rows }) {
    if (!rows?.length) return <div style={{ opacity: 0.6 }}>No rows</div>;
    const cols = Object.keys(rows[0]);
    return (
        <div style={{ overflow: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>{cols.map(c => <th key={c} style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>{cols.map(c => <td key={c} style={{ padding: 8, borderBottom: '1px solid #f6f6f6' }}>{String(r[c])}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


export default function P11ChatVthPostgres() {
    const [schema, setSchema] = useState(null);
    const [tab, setTab] = useState('ask');
    const [q, setQ] = useState('Top 5 products by total sales');
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');


    useEffect(() => { (async () => { try { setSchema(await getSchema()); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } })(); }, []);


    async function runAsk() { setBusy(true); setMsg(''); try { const r = await ask(q); setResult(r); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }
    async function runSearch() { setBusy(true); setMsg(''); try { const r = await search(q, 10); setResult({ search: r.items }); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }


    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Chat with Postgres Data (Gemini + pgvector)</h2>


            <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                <button onClick={() => setTab('ask')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'ask' ? '#111' : '#fff', color: tab === 'ask' ? '#fff' : '#111' }}>Ask (NL→SQL)</button>
                <button onClick={() => setTab('search')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'search' ? '#111' : '#fff', color: tab === 'search' ? '#fff' : '#111' }}>Semantic Search</button>
                <button onClick={async () => { const r = await embedAll(); setMsg(`Embedded ${r.updated} rows`); }} style={{ marginLeft: 'auto', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>Embed rows</button>
            </div>


            <div style={{ display: 'flex', gap: 8 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'ask' ? 'Ask a question to generate SQL…' : 'Search products semantically…'} style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                <button onClick={tab === 'ask' ? runAsk : runSearch} disabled={busy || !q.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>{busy ? 'Working…' : tab === 'ask' ? 'Ask' : 'Search'}</button>
            </div>


            {msg && <div style={{ marginTop: 8, opacity: 0.8 }}>{msg}</div>}


            {tab === 'ask' && result && (
                <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Generated SQL</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.sql}</pre>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>params: {JSON.stringify(result.params || [])} · time: {result.timeMs} ms</div>
                        {result.rationale && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>reasoning: {result.rationale}</div>}
                    </div>
                    <Table rows={result.rows || []} />
                </div>
            )}


            {tab === 'search' && result && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Top matches</div>
                    <Table rows={result.search || []} />
                </div>
            )}


            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
                Schema preview: {schema ? `${schema.tables.length} tables` : 'loading…'}
            </div>
        </div>
    );
}