import { useEffect, useState } from 'react';
import { listDocs, deleteDoc, uploadFile, search } from './api.js';
import Uploader from './components/Uploader.jsx';
import SearchBox from './components/SearchBox.jsx';
import Results from './components/Results.jsx';
import EvalPanel from './components/EvalPanel.jsx';
import SemanticSearchInfoIcon from './components/Info.tsx';


export default function P6SemanticSearch() {
    const [docs, setDocs] = useState([]);
    const [results, setResults] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [query, setQuery] = useState('');
    const [labels, setLabels] = useState({});
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');


    async function refresh() { setDocs(await listDocs()); }
    useEffect(() => { refresh(); }, []);


    async function runSearch(q, p = 0, s = 10) {
        if (!q?.trim()) return;
        setBusy(true); setMsg(''); setLabels({}); setPage(p); setSize(s); setQuery(q);
        try {
            const res = await search(q, p, s);
            setResults(res.results); setTotal(res.total);
        } catch (e) { setMsg('⚠️ ' + (e.message || String(e))); }
        finally { setBusy(false); }
    }


    function onPage(newPage) { runSearch(query, newPage, size); }


    function onLabel(r, lab) {
        const key = `${page}:${r.docTitle}:${r.page}:${r.score}`;
        setLabels(prev => ({ ...prev, [key]: lab }));
    }


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <div>
                <h3>Documents</h3>
                <Uploader onUpload={async f => { const res = await uploadFile(f); await refresh(); return res; }} />
                <div style={{ marginTop: 12 }}>
                    {docs.map(d => (
                        <div key={d._id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 8, marginBottom: 8 }}>
                            <div style={{ fontWeight: 600 }}>{d.title}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{d.pages} pages · {Math.round(d.sizeBytes / 1024)} KB</div>
                            <button onClick={async () => { await deleteDoc(d._id); await refresh(); }} style={{ marginTop: 6, padding: '6px 10px', border: '1px solid #f3c', borderRadius: 8 }}>Delete</button>
                        </div>
                    ))}
                    {docs.length === 0 && <div style={{ opacity: 0.7 }}>No docs yet</div>}
                </div>
            </div>


            <div>
                <h3>Semantic Search</h3>
                <SemanticSearchInfoIcon/>
                <SearchBox onSearch={runSearch} />
                {busy && <div style={{ marginTop: 8, opacity: 0.7 }}>Searching…</div>}
                {msg && <div style={{ marginTop: 8, color: '#b00020' }}>{msg}</div>}
                {results.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 12 }}>
                        <Results results={results} total={total} page={page} size={size} onPage={onPage} onLabel={onLabel} />
                        <EvalPanel labels={labels} size={size} />
                    </div>
                )}
            </div>
        </div>
    );
}