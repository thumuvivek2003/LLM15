const BASE = 'http://localhost:5057';
export type Msg = { role: 'user' | 'assistant'; content: string };


export async function chat(message: string, history: Msg[]) {
    const r = await fetch(`${BASE}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json() as Promise<{ text: string, tools: Array<{ name: string, args: any, result: any }> }>;
}