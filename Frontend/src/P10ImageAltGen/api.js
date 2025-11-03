const BASE = 'http://localhost:5059';


export async function listImages() { const r = await fetch(`${BASE}/api/images`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function uploadImages(files) { const fd = new FormData(); for (const f of files) fd.append('files', f); const r = await fetch(`${BASE}/api/images/upload`, { method: 'POST', body: fd }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function generate(ids, options) { const r = await fetch(`${BASE}/api/images/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, ...options }) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function updateOne(id, body) { const r = await fetch(`${BASE}/api/images/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }