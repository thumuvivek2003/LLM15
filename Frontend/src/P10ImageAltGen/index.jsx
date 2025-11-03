import { useEffect, useState } from 'react';
import { listImages, uploadImages, generate, updateOne } from './api';
import DownloadCSV from './DownloadCSV.jsx';


export default function App() {
    const [rows, setRows] = useState([]);
    const [sel, setSel] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [lang, setLang] = useState('en');
    const [length, setLength] = useState('short');
    const [includeText, setIncludeText] = useState(true);
    const [extraContext, setExtraContext] = useState('');


    async function refresh() { setRows(await listImages()); }
    useEffect(() => { refresh(); }, []);


    function toggle(id) { setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); }


    async function onUpload(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setBusy(true); setMsg('Uploading…');
        try { await uploadImages(files); await refresh(); setMsg('Uploaded.'); }
        catch (e) { setMsg('⚠️ ' + (e.message || e)); }
        finally { setBusy(false); e.target.value = ''; }
    }


    async function onGenerate() {
        const ids = Array.from(sel); if (!ids.length) return alert('Select images first');
        setBusy(true); setMsg('Generating…');
        try {
            await generate(ids, { lang, length, includeText, extraContext });
            await refresh(); setMsg('Done.');
        } catch (e) { setMsg('⚠️ ' + (e.message || e)); }
        finally { setBusy(false); }
    }


    async function onEdit(id, field, val) {
        const upd = await updateOne(id, { [field]: val });
        setRows(prev => prev.map(r => r._id === id ? upd : r));
    }


    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2>Image Alt‑Text Generator (Gemini)</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple onChange={onUpload} />
                    <DownloadCSV rows={rows.map(r => ({ id: r._id, filename: r.originalName, url: r.url, lang: r.lang, altText: r.altText || '', caption: r.caption || '' }))} />
                </div>
            </header>


            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 12 }}>
                <div style={{ gridColumn: 'span 5', border: '1px solid #eee', borderRadius: 10, padding: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label>Language
                        <input value={lang} onChange={e => setLang(e.target.value)} placeholder="e.g., en, hi, es" style={{ marginLeft: 8, padding: 6, border: '1px solid #ddd', borderRadius: 8 }} />
                    </label>
                    <label>Length
                        <select value={length} onChange={e => setLength(e.target.value)} style={{ marginLeft: 8, padding: 6, border: '1px solid #ddd', borderRadius: 8 }}>
                            <option value="short">short (5–15 words)</option>
                            <option value="long">long (1–2 sentences)</option>
                        </select>
                    </label>
                    <label>Include on‑image text?
                        <input type="checkbox" checked={includeText} onChange={e => setIncludeText(e.target.checked)} style={{ marginLeft: 8 }} />
                    </label>
                    <input value={extraContext} onChange={e => setExtraContext(e.target.value)} placeholder="Optional context (purpose / page / CTA)" style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 8 }} />
                    <button onClick={onGenerate} disabled={busy || sel.size === 0} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff' }}>
                        {busy ? 'Generating…' : `Generate for ${sel.size} image(s)`}
                    </button>
                    {msg && <span style={{ marginLeft: 8, opacity: 0.7 }}>{msg}</span>}
                </div>


                {rows.map(r => (
                    <div key={r._id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={sel.has(r._id)} onChange={() => toggle(r._id)} />
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.originalName}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>{r.status}</span>
                        </label>
                        <div style={{ marginTop: 6 }}>
                            <img src={`http://localhost:5059${r.url}`} alt="preview" style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: 6 }} />
                        </div>
                        <label style={{ display: 'block', marginTop: 6, fontSize: 12, opacity: 0.7 }}>Alt text</label>
                        <textarea value={r.altText || ''} onChange={e => onEdit(r._id, 'altText', e.target.value)} rows={2} style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 8 }} />
                        <label style={{ display: 'block', marginTop: 6, fontSize: 12, opacity: 0.7 }}>Caption (optional)</label>
                        <textarea value={r.caption || ''} onChange={e => onEdit(r._id, 'caption', e.target.value)} rows={2} style={{ width: '100%', padding: 6, border: '1px solid #ddd', borderRadius: 8 }} />
                    </div>
                ))}
            </section>


            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Accessibility tips: keep alt text concise, avoid "image of", include meaningful text, and match the image’s purpose in context. Use empty alt ("") for purely decorative images.
            </div>
        </div>
    );
}