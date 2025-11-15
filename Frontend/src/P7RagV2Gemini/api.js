const BASE = 'http://localhost:5000';


export async function startConversation({ title, docFilterIds = [] }) {
    const r = await fetch(`${BASE}/api/chat/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, docFilterIds }) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}


export function streamChat({ convId, message, onEvent }) {
    return new Promise(async (resolve) => {
        const resp = await fetch(`${BASE}/api/chat/stream`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ convId, message })
        });
        if (!resp.body) { onEvent('error', { error: 'No stream body' }); return resolve(); }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        (async function read() {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                let idx;
                while ((idx = buf.indexOf('\n\n')) !== -1) {
                    const packet = buf.slice(0, idx); buf = buf.slice(idx + 2);
                    const [evtLine, dataLine] = packet.split('\n');
                    if (!evtLine?.startsWith('event:')) continue;
                    const ev = evtLine.slice(6).trim();
                    const data = dataLine?.startsWith('data:') ? JSON.parse(dataLine.slice(5)) : {};
                    onEvent(ev, data);
                }
            }
            resolve();
        })();
    });
}


export async function listDocs() { const r = await fetch(`${BASE}/api/docs`); if (!r.ok) throw new Error('List failed'); return r.json(); }
export async function uploadFile(file) { const fd = new FormData(); fd.append('file', file); const r = await fetch(`${BASE}/api/docs/upload`, { method: 'POST', body: fd }); if (!r.ok) throw new Error(await r.text()); return r.json(); }
export async function deleteDoc(id) { const r = await fetch(`${BASE}/api/docs/${id}`, { method: 'DELETE' }); if (!r.ok) throw new Error(await r.text()); return r.json(); }