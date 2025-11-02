import { useState } from 'react';
export default function Uploader({ onUpload }) {
    const [hover, setHover] = useState(false); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
    async function handle(f) { if (!f) return; setBusy(true); setMsg(''); try { const res = await onUpload(f); setMsg(`Uploaded ${res.title} — ${res.pages} pages, ${res.chunks} chunks`); } catch (e) { setMsg('⚠️ ' + (e.message || e)); } finally { setBusy(false); } }
    return (
        <div onDragOver={e => { e.preventDefault(); setHover(true); }} onDragLeave={() => setHover(false)} onDrop={e => { e.preventDefault(); setHover(false); handle(e.dataTransfer.files?.[0]); }} style={{ padding: 16, border: '2px dashed #ccc', borderRadius: 12, textAlign: 'center', background: hover ? '#f8f8ff' : 'transparent' }}>
            <div>Drag & drop PDF/MD/TXT</div>
            <div>or</div>
            <label style={{ display: 'inline-block', marginTop: 8 }}>
                <input type="file" accept=".pdf,.md,.markdown,.txt" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
                <span style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>{busy ? 'Uploading…' : 'Choose file'}</span>
            </label>
            {msg && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{msg}</div>}
        </div>
    );
}