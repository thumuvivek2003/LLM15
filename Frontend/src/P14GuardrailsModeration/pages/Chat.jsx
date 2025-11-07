import { useState } from 'react';
import { modCheck, chat } from '../api';


export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState('');


    async function send() {
        const text = input.trim(); if (!text || busy) return;
        setBusy(true); setNotice('');
        try {
            const pre = await modCheck(text);
            if (pre.action === 'block') { setNotice('Blocked: ' + pre.categories.join(', ')); setBusy(false); return; }
            const res = await chat(text, messages);
            if (res.blocked) setNotice('Blocked');
            setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: res.text }]);
            setInput('');
        } catch (e) { setNotice('⚠️ ' + (e.message || e)); }
        finally { setBusy(false); }
    }


    return (
        <div>
            <div style={{ display: 'grid', gap: 8 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === 'user' ? 'end' : 'start' }}>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                        <div style={{ background: m.role === 'user' ? '#e8f0fe' : '#f5f5f5', borderRadius: 12, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder={busy ? 'Checking…' : 'Say something…'} disabled={busy}
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }} />
                <button type="submit" disabled={busy || !input.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: '#fff' }}>Send</button>
            </form>
            {notice && <div style={{ marginTop: 8, opacity: 0.8 }}>{notice}</div>}
        </div>
    );
}