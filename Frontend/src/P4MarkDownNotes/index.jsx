import { useState } from 'react'; import DropZone from './DropZone.jsx';
import { uploadAndSummarize } from './api.js';


export default function P4MarkDownNotes() {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('tldr'); // 'tldr' | 'minutes' | 'brief'
    const [bullets, setBullets] = useState(7);
    const [length, setLength] = useState('medium');
    const [includeQuotes, setIncludeQuotes] = useState(false);
    const [model, setModel] = useState('gpt-4o-mini');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    async function onGo() {
        setError('');
        setResult(null);
        if (!file) { setError('Pick a file first'); return; }
        setLoading(true);
        try {
            const res = await uploadAndSummarize({ file, mode, bullets, length, includeQuotes, model });
            setResult(res);
        } catch (e) {
            setError(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }


    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Markdown Notes TL;DR</h2>
            <DropZone onFile={setFile} />
            {file && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Selected: <b>{file.name}</b> {file.size}</div>}


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                <label>Mode
                    <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                        <option value="tldr">TL;DR</option>
                        <option value="minutes">Meeting Minutes</option>
                        <option value="brief">Executive Brief</option>
                    </select>
                </label>
                <label>Bullets
                    <input type="number" min={3} max={20} value={bullets} onChange={e => setBullets(Number(e.target.value))}
                        style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                </label>
                <label>Length
                    <select value={length} onChange={e => setLength(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                        <option value="short">short</option>
                        <option value="medium">medium</option>
                        <option value="long">long</option>
                    </select>
                </label>
                <label>Include quotes?
                    <input type="checkbox" checked={includeQuotes} onChange={e => setIncludeQuotes(e.target.checked)} />
                </label>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <label>Model
                    <input value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                </label>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                    <button onClick={onGo} disabled={loading || !file} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>
                        {loading ? 'Summarizing…' : 'Summarize'}
                    </button>
                </div>
            </div>


            {error && <div style={{ color: '#b00020', marginTop: 8 }}>⚠️ {error}</div>}


            {result && (
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, marginTop: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{result.file}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result.summary}</pre>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                        {result.meta.chunks} chunk(s) · ~{result.meta.words} words · bullets={result.meta.bullets} · {result.meta.length} · mode={result.meta.mode}
                    </div>
                </div>
            )}
        </div>
    );
}