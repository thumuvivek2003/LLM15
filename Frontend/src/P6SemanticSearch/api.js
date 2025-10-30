const BASE = 'http://localhost:5050';


export async function listDocs() { const r = await fetch(`${BASE}/api/docs`); if (!r.ok) throw new Error('List failed'); return r.json(); }
export async function deleteDoc(id) { const r = await fetch(`${BASE}/api/docs/${id}`, { method: 'DELETE' }); if (!r.ok) throw new Error('Delete failed'); return r.json(); }
export async function uploadFile(file) { const fd = new FormData(); fd.append('file', file); const r = await fetch(`${BASE}/api/docs/upload`, { method: 'POST', body: fd }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function search(query, page = 0, size = 10) { const r = await fetch(`${BASE}/api/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, page, size }) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }