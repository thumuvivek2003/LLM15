import { useState } from 'react';
import Search from './components/Search';
import Eval from './components/Eval';


export default function App() {
    const [tab, setTab] = useState('search');
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <h2>RAG with Re‑rankers (Gemini)</h2>
                <button onClick={() => setTab('search')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'search' ? '#111' : '#fff', color: tab === 'search' ? '#fff' : '#111' }}>Search</button>
                <button onClick={() => setTab('eval')} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: tab === 'eval' ? '#111' : '#fff', color: tab === 'eval' ? '#fff' : '#111' }}>Eval</button>
            </header>
            <section style={{ marginTop: 12 }}>
                {tab === 'search' ? <Search /> : <Eval />}
            </section>
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                Cost note: reranking scores N candidates with an LLM call that returns an array. Keep K small (e.g., 24) and truncate snippets to ~600 chars to control tokens.
            </div>
        </div>
    );
}