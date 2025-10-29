const BASE = 'http://localhost:5050';


export async function uploadAndSummarize({ file, mode, bullets, length, includeQuotes, model }) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', mode);
    fd.append('bullets', String(bullets));
    fd.append('length', length);
    fd.append('includeQuotes', String(includeQuotes));
    fd.append('model', model);


    const r = await fetch(`${BASE}/api/notes/summarize`, { method: 'POST', body: fd });
    if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(t || 'Upload failed');
    }
    return r.json();
}