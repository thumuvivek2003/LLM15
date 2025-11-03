const BASE = 'http://localhost:5000';
const opts = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };


export async function register(orgName, email, name, password) { const r = await fetch(`${BASE}/api/auth/register`, { method: 'POST', body: JSON.stringify({ orgName, email, name, password }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function login(email, password) { const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function list(orgId, q = '') { const r = await fetch(`${BASE}/api/prompts?orgId=${orgId}&q=${encodeURIComponent(q)}`, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function createPrompt(p) { const r = await fetch(`${BASE}/api/prompts`, { method: 'POST', body: JSON.stringify(p), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function createVersion(id, body, orgId) { console.log('id', orgId); const r = await fetch(`${BASE}/api/prompts/${id}/versions`, { method: 'POST', body: JSON.stringify({ body, orgId }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function submitVersion(id, orgId) { const r = await fetch(`${BASE}/api/prompts/versions/${id}/submit`, { method: 'POST', body: JSON.stringify({ orgId }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function decideVersion(id, decision, comment = '',orgId) { const r = await fetch(`${BASE}/api/prompts/versions/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, comment,orgId }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function versions(id, orgId) { const r = await fetch(`${BASE}/api/prompts/${id}/versions?orgId=${orgId}`, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function preview(body, vars, orgId) { const r = await fetch(`${BASE}/api/prompts/preview`, { method: 'POST', body: JSON.stringify({ body, vars, orgId }), ...opts }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function audits(orgId) { const r = await fetch(`${BASE}/api/prompts/audit/list?orgId=${orgId}`, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }