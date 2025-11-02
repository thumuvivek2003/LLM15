import { useEffect, useState } from 'react';
import { listDocs, uploadFile, deleteDoc, startConversation, streamChat } from './api.js';
import Uploader from './components/Uploader.jsx';
import Chat from './components/Chat.jsx';


export default function App() {
    const [docs, setDocs] = useState([]);
    const [msg, setMsg] = useState('');


    async function refresh() { try { setDocs(await listDocs()); } catch (e) { setMsg('⚠️ ' + (e.message || String(e))); } }
    useEffect(() => { refresh(); }, []);


    return (
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ padding: '10px 16px', borderBottom: '1px solid #eee', fontWeight: 700 }}>Multi‑doc Chat (RAG v2, Google GenAI)</header>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Uploader onUpload={async f => { const res = await uploadFile(f); await refresh(); return res; }} />
                <div style={{ fontSize: 12, opacity: 0.7 }}>Docs: {docs.length}</div>
                {msg && <div style={{ color: '#b00020' }}>{msg}</div>}
            </div>
            <Chat docs={docs} startConv={startConversation} streamChat={streamChat} />
        </div>
    );
}