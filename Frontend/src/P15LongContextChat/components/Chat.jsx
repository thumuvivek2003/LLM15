import { useEffect, useState } from 'react';
import { createThread, getThread, sendMsg } from '../api';
import TokenBar from './TokenBar';
import MemoryPanel from './MemoryPanel';



export default function Chat() {
    const [thread, setThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('Hey! Help me plan a 3‑day Bangalore trip based on my likes from above.');
    const [useMemory, setUseMemory] = useState(true);
    const [busy, setBusy] = useState(false);
    const [used, setUsed] = useState(0);
    const budget = 10;
    useEffect(() => {
        (async () => {
            const t = await createThread(); setThread(t);
            const full = await getThread(t.id); setMessages(full.messages || []);
        })();
    }, []);


    async function refresh() { const full = await getThread(thread.id); setMessages(full.messages || []); }


    async function send() {
        if (!input.trim() || busy) return; setBusy(true);
        try {
            const r = await sendMsg(thread.id, input, useMemory);
            setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: r.reply }]);
            setInput('');
            const u = messages.reduce((s, m) => s + Math.ceil((m.content || '').length / 4), 0);
            setUsed(u);
        } finally { setBusy(false); }
    }


    if (!thread) return <div>Loading…</div>;


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
            <div>
                <TokenBar used={used} budget={budget} />
                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                    {messages.map((m, i) => (
                        <div key={i}>
                            <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                            <div style={{ background: m.role === 'user' ? '#e8f0fe' : '#f5f5f5', borderRadius: 12, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                        </div>
                    ))}
                </div>
                <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder={busy ? 'Thinking…' : 'Type a message…'} disabled={busy}
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                    <button type="submit" disabled={busy || !input.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Send</button>
                </form>
                <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <input type="checkbox" checked={useMemory} onChange={e => setUseMemory(e.target.checked)} /> Include summary memory
                </label>
            </div>
            <MemoryPanel threadId={thread.id} />
        </div>
    );
}