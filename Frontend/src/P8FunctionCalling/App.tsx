import { useState } from 'react';
import { chat } from './api';
import type { Msg } from './api';


export default function P8FunctionCalling() {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [toolLog, setToolLog] = useState<any[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');


    async function send() {
        const text = input.trim(); if (!text || busy) return;
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput(''); setBusy(true); setError(''); setToolLog([]);
        try {
            const res = await chat(text, messages);
            setToolLog(res.tools);
            setMessages(prev => [...prev, { role: 'assistant', content: res.text }]);
        } catch (e: any) { setError(String(e.message || e)); }
        finally { setBusy(false); }
    }


    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <h2>Function Calling Demo (Gemini)</h2>
            <div style={{ display: 'grid', gap: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === 'user' ? 'end' : 'start' }}>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                        <div style={{ background: m.role === 'user' ? '#e8f0fe' : '#f5f5f5', borderRadius: 12, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                ))}
            </div>


            <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder={busy ? 'Thinking…' : 'Ask about weather/math/calendar…'} disabled={busy}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                <button type="submit" disabled={busy || !input.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Send</button>
            </form>


            {error && <div style={{ color: '#b00020', marginTop: 8 }}>⚠️ {error}</div>}


            {toolLog.length > 0 && (
                <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 10, marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Tool calls</div>
                    {toolLog.map((t, i) => (
                        <div key={i} style={{ border: '1px solid #f2f2f2', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                            <div><b>{t.name}</b></div>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code>args: {JSON.stringify(t.args)}</code></pre>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}><code>result: {JSON.stringify(t.result)}</code></pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}