const BASE = 'http://localhost:5050';


export async function listPresets(q = '') {
    const url = q ? `${BASE}/api/presets?q=${encodeURIComponent(q)}` : `${BASE}/api/presets`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Failed to list presets');
    return r.json();
}


export async function createPreset(data) {
    const r = await fetch(`${BASE}/api/presets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to create');
    return r.json();
}


export async function updatePreset(id, data) {
    const r = await fetch(`${BASE}/api/presets/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to update');
    return r.json();
}


export async function deletePreset(id) {
    const r = await fetch(`${BASE}/api/presets/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed to delete');
    return r.json();
}


export async function runOnce(payload) {
    const r = await fetch(`${BASE}/api/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('Run failed');
    return r.json();
}


export async function runStream(payload, onDelta) {
    const r = await fetch(`${BASE}/api/run?stream=1`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!r.ok || !r.body) throw new Error('Stream failed');


    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';


    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buf.indexOf('\n\n')) !== -1) {
            const packet = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            if (packet.startsWith('data:')) {
                const payload = packet.slice(5).trim();
                if (!payload) continue;
                try {
                    const { delta } = JSON.parse(payload);
                    if (delta) onDelta(delta);
                } catch { }
            }
        }
    }
}