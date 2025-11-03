import { useState } from 'react';
import Login from './pages/Login';
import Library from './pages/Library';
import Editor from './pages/Editor';
import Approvals from './pages/Approvals';
import Audit from './pages/Audit';


export default function P12TeamPromptLibrary() {
    const [auth, setAuth] = useState(null);
    const [view, setView] = useState('library');
    const [openPrompt, setOpenPrompt] = useState(null);
    const orgId = auth?.orgId || localStorage.getItem('orgId');


    if (!auth) return <Login onAuth={setAuth} />;


    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <h2>Team Prompt Library</h2>
                <button onClick={() => setView('library')} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>Library</button>
                <button onClick={() => setView('approvals')} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8 }}>Approvals</button>
                <button onClick={() => setView('audit')} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8, marginLeft: 'auto' }}>Audit</button>
            </header>
            {view === 'library' && (!openPrompt ? <Library orgId={orgId} onOpen={(p) => { setOpenPrompt(p); }} /> : <Editor orgId={orgId} prompt={openPrompt} onBack={() => setOpenPrompt(null)} />)}
            {view === 'approvals' && <Approvals orgId={orgId} />}
            {view === 'audit' && <Audit orgId={orgId} />}
        </div>
    );
}