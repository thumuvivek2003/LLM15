const BASE = 'http://localhost:5000';


export function login() {
    const w = window.open(`${BASE}/auth/login`, 'oauth', 'width=500,height=700');
    return new Promise(res => {
        const h = (e) => { if (e.data === 'oauth:ok') { window.removeEventListener('message', h); res(true); } };
        window.addEventListener('message', h);
    });
}


export async function me() { const r = await fetch(`${BASE}/api/me`, { credentials: 'include' }); if (!r.ok) throw new Error('Not authed'); return r.json(); }
export async function list() { const r = await fetch(`${BASE}/api/gmail/list`, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function message(id) { const r = await fetch(`${BASE}/api/gmail/message?id=${encodeURIComponent(id)}`, { credentials: 'include' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function generateReply(payload) { const r = await fetch(`${BASE}/api/generate-reply`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function createDraft(payload) { const r = await fetch(`${BASE}/api/gmail/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }