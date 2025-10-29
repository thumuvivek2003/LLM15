const BASE = 'http://localhost:5050';


export async function summarize(url, options) {
    const r = await fetch(`${BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
}