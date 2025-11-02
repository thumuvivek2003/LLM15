import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';
import SourcesPanel from './SourcesPanel.jsx';
import DocFilter from './DocFilter.jsx';


export default function Chat({ docs, startConv, streamChat }) {
    const [conv, setConv] = useState(null);
    const [docFilter, setDocFilter] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [citations, setCitations] = useState([]);
    const endRef = useRef(null);


    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);


    async function ensureConv() {
        if (conv) return conv;
        const c = await startConv({ title: 'Multi‑doc Chat', docFilterIds: docFilter });
        setConv(c); return c;
    }


    async function send() {
        const text = input.trim(); if (!text || streaming) return;
        const c = await ensureConv();
        const next = [...messages, { role: 'user', content: text }];
        setMessages(next); setInput(''); setStreaming(true); setCitations([]);


        // placeholder assistant message
        const idx = next.length;
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);


        let assistant = '';
        await streamChat({
            convId: c.convId, message: text, onEvent: (ev, data) => {
                if (ev === 'delta') {
                    assistant += data.delta || '';
                    setMessages(prev => { const cp = prev.slice(); cp[idx] = { role: 'assistant', content: assistant }; return cp; });
                } else if (ev === 'sources') { setCitations(data.citations || []); }
                else if (ev === 'rewrites') { /* could show rewritten queries */ }
            }
        });
        setStreaming(false);
    }


    return (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: 16, height: '100vh' }}>
            <div style={{ padding: 12, borderRight: '1px solid #eee', overflow: 'auto' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Filters</div>
                <DocFilter docs={docs} selected={docFilter} onChange={setDocFilter} />
                <div style={{ marginTop: 10 }}>
                    <button onClick={async () => { const c = await startConv({ title: 'Multi‑doc Chat', docFilterIds: docFilter }); setConv(c); setMessages([]); setCitations([]); }}
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}>New Chat</button>
                </div>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {messages.map((m, i) => <MessageBubble key={i} role={m.role} content={m.content} />)}
                    <div ref={endRef} />
                </div>
                <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}>
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder={streaming ? 'Generating…' : 'Ask about your docs…'} disabled={streaming}
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                    <button type="submit" disabled={streaming || !input.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Send</button>
                </form>
            </div>


            <div style={{ padding: 12, borderLeft: '1px solid #eee', overflow: 'auto' }}>
                <SourcesPanel citations={citations} />
            </div>
        </div>
    );
}