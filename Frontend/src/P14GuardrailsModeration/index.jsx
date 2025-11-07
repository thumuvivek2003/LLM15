import { useState } from 'react';
import Chat from './pages/Chat';
import RedTeam from './pages/RedTeam';


export default function App() {
    const [tab, setTab] = useState('chat');
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <h2>Guardrails & Moderation (Gemini)</h2>
                <button onClick={() => setTab('chat')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'chat' ? '#111' : '#fff', color: tab === 'chat' ? '#fff' : '#111' }}>Chat</button>
                <button onClick={() => setTab('red')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'red' ? '#111' : '#fff', color: tab === 'red' ? '#fff' : '#111' }}>Red‑Team</button>
            </header>
            <section style={{ marginTop: 12 }}>
                {tab === 'chat' ? <Chat /> : <RedTeam />}
            </section>
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Notes: This demo combines deterministic filters + Gemini JSON moderation. Expand PII patterns & categories for your needs, and log incidents to a secure store.
            </div>
        </div>
    );
}