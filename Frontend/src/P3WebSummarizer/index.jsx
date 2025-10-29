import { useState } from 'react';
import { summarize } from './api.js';


export default function P3WebSummarizer() {
    const [url, setUrl] = useState('');
    const [bullets, setBullets] = useState(7);
    const [length, setLength] = useState('medium');
    const [includeQuotes, setIncludeQuotes] = useState(false);
    const [model, setModel] = useState('gpt-4o-mini');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');


    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);
        try {
            const data = await summarize(url, { bullets, length, includeQuotes, model });
            setResult(data);
        } catch (e) {
            setError(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }


    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Summarize Webpage</h2>
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                    <label>Bullets
                        <input type="number" min={3} max={15} value={bullets}
                            onChange={e => setBullets(Number(e.target.value))}
                            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    </label>
                    <label>Length
                        <select value={length} onChange={e => setLength(e.target.value)}
                            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }}>
                            <option value="short">short</option>
                            <option value="medium">medium</option>
                            <option value="long">long</option>
                        </select>
                    </label>
                    <label>Include quotes?
                        <input type="checkbox" checked={includeQuotes} onChange={e => setIncludeQuotes(e.target.checked)} />
                    </label>
                    <label>Model
                        <input value={model} onChange={e => setModel(e.target.value)}
                            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 8 }} />
                    </label>
                </div>
                <button type="submit" disabled={loading || !url}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>
                    {loading ? 'Summarizing…' : 'Summarize'}
                </button>
            </form>


            {error && <div style={{ color: '#b00020' }}>⚠️ {error}</div>}


            {result && (
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{result.url}</div>
                    <h3 style={{ marginTop: 0 }}>{result.title}</h3>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{result.summary}</pre>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                        {result.meta.chunks} chunk(s) · ~{result.meta.words} words · bullets={result.meta.bullets} · {result.meta.length}
                    </div>
                </div>
            )}
        </div>
    );
}